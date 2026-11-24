package api

import (
	"net/http"
	"strings"

	"stride-whatsapp-worker/internal/session"

	"github.com/gin-gonic/gin"
)

// Handler holds API route handlers and dependencies.
type Handler struct {
	sessions *session.SessionManager
}

// NewHandler creates a new API Handler instance.
func NewHandler(sm *session.SessionManager) *Handler {
	return &Handler{sessions: sm}
}

// RegisterRoutes attaches all HTTP endpoints to the Gin router.
func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.GET("/health", h.Health)
	r.POST("/session/pair", h.Pair)
	r.GET("/session/status/:userId", h.Status)
	r.GET("/session/chats/:userId", h.Chats)
	r.GET("/session/messages/:userId/:chatId", h.Messages)
	r.POST("/session/react", h.React)
	r.POST("/session/send", h.Send)
	r.POST("/session/disconnect", h.Disconnect)
}

// Health returns worker health status and active session count.
func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":   "ok",
		"worker":   "whatsmeow",
		"sessions": h.sessions.Count(),
	})
}

func digitsOnly(raw string) string {
	return strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, raw)
}
