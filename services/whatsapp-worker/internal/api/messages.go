package api

import (
	"context"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"stride-whatsapp-worker/internal/models"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"google.golang.org/protobuf/proto"
)

// Messages returns chronological message history for a specific chat.
func (h *Handler) Messages(c *gin.Context) {
	userID := c.Param("userId")
	chatID := c.Param("chatId")

	sess, err := h.sessions.GetOrCreate(userID)
	if err != nil || sess == nil {
		c.JSON(http.StatusOK, gin.H{"messages": []interface{}{}})
		return
	}

	sess.RLock()
	msgs := sess.Messages[chatID]
	if len(msgs) == 0 {
		cleanID := strings.Split(chatID, "@")[0]
		for k, v := range sess.Messages {
			if strings.Split(k, "@")[0] == cleanID {
				msgs = v
				break
			}
		}
	}
	if msgs == nil {
		msgs = []*models.SessionMessage{}
	}

	sortedMsgs := make([]*models.SessionMessage, len(msgs))
	copy(sortedMsgs, msgs)
	sort.Slice(sortedMsgs, func(i, j int) bool {
		return sortedMsgs[i].Timestamp.Before(sortedMsgs[j].Timestamp)
	})
	sess.RUnlock()

	c.JSON(http.StatusOK, gin.H{"messages": sortedMsgs})
}

// React sends an emoji reaction to a message.
func (h *Handler) React(c *gin.Context) {
	var req struct {
		UserID    string `json:"userId" binding:"required"`
		ChatID    string `json:"chatId" binding:"required"`
		MessageID string `json:"messageId" binding:"required"`
		Reaction  string `json:"reaction"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sess, ok := h.sessions.Get(req.UserID)
	if !ok || sess == nil || !sess.Connected {
		c.JSON(http.StatusBadRequest, gin.H{"error": "WhatsApp is not connected for this user"})
		return
	}

	targetJID, err := types.ParseJID(req.ChatID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("invalid JID: %v", err)})
		return
	}

	msg := sess.Client.BuildReaction(targetJID, types.EmptyJID, req.MessageID, req.Reaction)
	resp, err := sess.Client.SendMessage(context.Background(), targetJID, msg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("react error: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "messageId": resp.ID})
}

// Send sends an outgoing text message to a WhatsApp chat or phone number.
func (h *Handler) Send(c *gin.Context) {
	var req struct {
		UserID  string `json:"userId" binding:"required"`
		ChatID  string `json:"chatId" binding:"required"`
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sess, err := h.sessions.GetOrCreate(req.UserID)
	if err != nil || sess == nil || sess.Client == nil || !sess.Client.IsConnected() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "WhatsApp is not connected for this user"})
		return
	}

	jidStr := req.ChatID
	if !strings.Contains(jidStr, "@") {
		jidStr = digitsOnly(jidStr) + "@s.whatsapp.net"
	}

	targetJID, err := types.ParseJID(jidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("invalid JID: %v", err)})
		return
	}

	msg := &waE2E.Message{Conversation: proto.String(req.Content)}
	resp, err := sess.Client.SendMessage(context.Background(), targetJID, msg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("send error: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"messageId": resp.ID,
		"timestamp": resp.Timestamp.Format(time.RFC3339),
	})
}
