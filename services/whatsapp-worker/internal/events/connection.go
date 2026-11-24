package events

import (
	"context"
	"log"
	"time"

	"stride-whatsapp-worker/internal/models"
	"stride-whatsapp-worker/internal/webhook"

	waEvents "go.mau.fi/whatsmeow/types/events"
)

func handleConnected(s *models.SessionState, userID string, _ *waEvents.Connected) {
	s.Lock()
	s.Connected = true
	s.QRCode = ""
	if s.Client != nil && s.Client.Store != nil && s.Client.Store.ID != nil {
		s.PhoneNumber = s.Client.Store.ID.User
		s.PushName = s.Client.Store.PushName
	}
	phone := s.PhoneNumber
	push := s.PushName
	s.Unlock()
	log.Printf("[User %s] WhatsApp Connected: %s (%s)", userID, phone, push)

	go func() {
		if s.Client == nil {
			return
		}
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		groups, err := s.Client.GetJoinedGroups(ctx)
		if err == nil && len(groups) > 0 {
			var syncedGroups []*models.SessionChat
			s.Lock()
			for _, g := range groups {
				jidStr := g.JID.String()
				var pList []string
				for _, p := range g.Participants {
					pList = append(pList, p.JID.User)
				}
				groupName := g.GroupName.Name
				if groupName == "" {
					groupName = "Group conversation"
				}
				if existing, ok := s.Chats[jidStr]; ok {
					existing.Name = groupName
					existing.IsGroup = true
					existing.Participants = pList
					syncedGroups = append(syncedGroups, existing)
				} else {
					newGroup := &models.SessionChat{
						ID:           jidStr,
						Name:         groupName,
						IsGroup:      true,
						Participants: pList,
						UnreadCount:  0,
						UpdatedAt:    time.Time{},
					}
					s.Chats[jidStr] = newGroup
					syncedGroups = append(syncedGroups, newGroup)
				}
			}
			s.Unlock()

			if len(syncedGroups) > 0 {
				webhook.SendWebhook(map[string]interface{}{
					"type":     "history_sync",
					"userId":   userID,
					"chats":    syncedGroups,
					"messages": []*models.SessionMessage{},
				})
			}
		}
	}()

	webhook.SendWebhook(map[string]interface{}{
		"type":        "status_update",
		"userId":      userID,
		"connected":   true,
		"phoneNumber": phone,
		"pushName":    push,
	})
}

func handleLoggedOut(s *models.SessionState, userID string) {
	s.Lock()
	s.Connected = false
	s.QRCode = ""
	s.PhoneNumber = ""
	s.PushName = ""
	s.Unlock()
	log.Printf("[User %s] WhatsApp Logged Out", userID)
}
