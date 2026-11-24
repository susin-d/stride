package api

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"stride-whatsapp-worker/internal/webhook"

	"github.com/gin-gonic/gin"
	qrcode "github.com/skip2/go-qrcode"
	"go.mau.fi/whatsmeow"
)

// Pair initiates WhatsApp QR code or phone number pairing code flow.
func (h *Handler) Pair(c *gin.Context) {
	var req struct {
		UserID      string `json:"userId" binding:"required"`
		PhoneNumber string `json:"phoneNumber"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	sess, err := h.sessions.GetOrCreate(req.UserID)
	if err != nil {
		log.Printf("[Pair] GetOrCreate failed for %s: %v", req.UserID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sess.RLock()
	isConnected := sess.Connected || (sess.Client != nil && sess.Client.IsConnected())
	isLoggedIn := sess.Client != nil && sess.Client.IsLoggedIn()
	hasDeviceID := sess.Device != nil && sess.Device.ID != nil
	phoneNum := sess.PhoneNumber
	pushName := sess.PushName
	existingQR := sess.QRCode
	sess.RUnlock()

	if isConnected || isLoggedIn || hasDeviceID {
		log.Printf("[Pair] user %s already has device %v (connected=%v loggedIn=%v) — returning 200", req.UserID, hasDeviceID, isConnected, isLoggedIn)
		c.JSON(http.StatusOK, gin.H{
			"connected":   true,
			"phoneNumber": phoneNum,
			"pushName":    pushName,
			"qrCode":      existingQR,
		})
		return
	}

	if req.PhoneNumber != "" {
		cleanPhone := digitsOnly(req.PhoneNumber)
		if !sess.Client.IsConnected() {
			_ = sess.Client.Connect()
		}
		code, err := sess.Client.PairPhone(context.Background(), cleanPhone, true, whatsmeow.PairClientChrome, "Chrome (Linux)")
		if err != nil {
			log.Printf("[PairPhone] failed for %s (%s): %v", req.UserID, cleanPhone, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("pairing code failed: %v", err)})
			return
		}
		sess.Lock()
		sess.PairingCode = code
		sess.Unlock()

		c.JSON(http.StatusOK, gin.H{
			"connected":   false,
			"pairingCode": code,
			"qrCode":      "",
		})
		return
	}

	if existingQR != "" {
		c.JSON(http.StatusOK, gin.H{"connected": false, "qrCode": existingQR})
		return
	}

	if sess.Client.IsConnected() {
		sess.Client.Disconnect()
	}

	qrChan, err := sess.Client.GetQRChannel(context.Background())
	if err != nil {
		log.Printf("[Pair] GetQRChannel failed for %s: %v", req.UserID, err)
		if existingQR != "" {
			c.JSON(http.StatusOK, gin.H{"connected": false, "qrCode": existingQR})
			return
		}
		c.JSON(http.StatusOK, gin.H{"connected": false, "qrCode": "", "error": fmt.Sprintf("GetQRChannel error: %v", err)})
		return
	}

	if err := sess.Client.Connect(); err != nil {
		log.Printf("[Pair] Connect failed for %s: %v", req.UserID, err)
		if strings.Contains(err.Error(), "already connected") || strings.Contains(err.Error(), "already logged in") {
			c.JSON(http.StatusOK, gin.H{"connected": false, "qrCode": existingQR, "error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("connect error: %v", err)})
		return
	}

	var returnQR string
	qrReceived := make(chan struct{}, 1)

	go func() {
		for evt := range qrChan {
			if evt.Event == "code" {
				pngBytes, err := qrcode.Encode(evt.Code, qrcode.Medium, 256)
				if err == nil {
					qrData := "data:image/png;base64," + base64.StdEncoding.EncodeToString(pngBytes)
					sess.Lock()
					sess.QRCode = qrData
					sess.Unlock()
					log.Printf("[User %s] Real WhatsApp QR code generated successfully (len: %d)", req.UserID, len(qrData))

					webhook.SendWebhookWithTimeout(map[string]interface{}{
						"type":   "qr_update",
						"userId": req.UserID,
						"qrCode": qrData,
					}, 4*time.Second)
				}
				select {
				case qrReceived <- struct{}{}:
				default:
				}
			} else if evt.Event == "success" {
				log.Printf("[User %s] WhatsApp QR scan confirmed successfully", req.UserID)
			}
		}
	}()

	select {
	case <-qrReceived:
	case <-time.After(5 * time.Second):
	}
	sess.RLock()
	returnQR = sess.QRCode
	sess.RUnlock()

	c.JSON(http.StatusOK, gin.H{
		"connected": sess.Connected,
		"qrCode":    returnQR,
	})
}

// Status returns connection status and session information for a given user.
func (h *Handler) Status(c *gin.Context) {
	userID := c.Param("userId")
	sess, err := h.sessions.GetOrCreate(userID)
	if err != nil || sess == nil {
		c.JSON(http.StatusOK, gin.H{"connected": false, "qrCode": ""})
		return
	}

	sess.RLock()
	defer sess.RUnlock()

	isConnected := sess.Connected || (sess.Client != nil && (sess.Client.IsConnected() || sess.Client.IsLoggedIn()))
	phoneNumber := sess.PhoneNumber
	pushName := sess.PushName
	if phoneNumber == "" && sess.Device != nil && sess.Device.ID != nil {
		phoneNumber = sess.Device.ID.User
		pushName = sess.Device.PushName
	}

	c.JSON(http.StatusOK, gin.H{
		"connected":   isConnected,
		"qrCode":      sess.QRCode,
		"pairingCode": sess.PairingCode,
		"phoneNumber": phoneNumber,
		"pushName":    pushName,
	})
}

// Disconnect logs out and removes the WhatsApp session for the user.
func (h *Handler) Disconnect(c *gin.Context) {
	var req struct {
		UserID string `json:"userId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.sessions.Delete(req.UserID)
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "logged out"})
}
