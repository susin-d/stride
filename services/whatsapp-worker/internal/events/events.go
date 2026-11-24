package events

import (
	"context"
	"encoding/base64"
	"fmt"
	"time"

	"stride-whatsapp-worker/internal/models"
	"stride-whatsapp-worker/internal/parser"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	waEvents "go.mau.fi/whatsmeow/types/events"
)

// HandleEvent dispatches incoming whatsmeow events to appropriate handlers.
func HandleEvent(s *models.SessionState, userID string, evt interface{}) {
	switch v := evt.(type) {
	case *waEvents.HistorySync:
		handleHistorySync(s, userID, v)
	case *waEvents.Connected:
		handleConnected(s, userID, v)
	case *waEvents.LoggedOut:
		handleLoggedOut(s, userID)
	case *waEvents.Message:
		handleMessage(s, userID, v)
	}
}

func downloadMediaDataURI(client *whatsmeow.Client, rawMsg *waE2E.Message, timeout time.Duration) (string, int, error) {
	if client == nil {
		return "", 0, nil
	}
	downloadable, mime := parser.ExtractDownloadableMessage(rawMsg)
	if downloadable == nil {
		return "", 0, nil
	}
	dlMsg, ok := downloadable.(whatsmeow.DownloadableMessage)
	if !ok {
		return "", 0, nil
	}
	ctxDl, cancelDl := context.WithTimeout(context.Background(), timeout)
	defer cancelDl()
	data, err := client.Download(ctxDl, dlMsg)
	if err != nil {
		return "", 0, err
	}
	if len(data) == 0 {
		return "", 0, nil
	}
	if mime == "" {
		mime = "image/jpeg"
	}
	return fmt.Sprintf("data:%s;base64,%s", mime, base64.StdEncoding.EncodeToString(data)), len(data), nil
}
