package events

import (
	"log"
	"strings"
	"time"

	"stride-whatsapp-worker/internal/contacts"
	"stride-whatsapp-worker/internal/models"
	"stride-whatsapp-worker/internal/parser"
	"stride-whatsapp-worker/internal/webhook"

	"go.mau.fi/whatsmeow/types"
	waEvents "go.mau.fi/whatsmeow/types/events"
)

func handleHistorySync(s *models.SessionState, userID string, v *waEvents.HistorySync) {
	log.Printf("[User %s] Received HistorySync chunk (%s): %d conversations", userID, v.Data.GetSyncType().String(), len(v.Data.GetConversations()))

	var syncedChats []*models.SessionChat
	var syncedMessages []*models.SessionMessage

	s.Lock()
	for _, conv := range v.Data.GetConversations() {
		chatJIDStr := conv.GetID()
		parsedJID, _ := types.ParseJID(chatJIDStr)
		isGroup := strings.HasSuffix(chatJIDStr, "@g.us")
		unread := int(conv.GetUnreadCount())
		rawName := conv.GetName()

		chatName := contacts.ResolveChatName(s, parsedJID, isGroup, rawName)

		lastText := ""
		var lastTime time.Time

		for _, hMsg := range conv.GetMessages() {
			webMsg := hMsg.GetMessage()
			if webMsg == nil {
				continue
			}
			rawM := webMsg.GetMessage()
			if rawM == nil {
				continue
			}

			msgID := ""
			fromMe := false
			senderJID := chatJIDStr
			if key := webMsg.GetKey(); key != nil {
				msgID = key.GetID()
				fromMe = key.GetFromMe()
				if key.GetParticipant() != "" {
					senderJID = key.GetParticipant()
				}
			}

			if rxTarget, rxEmoji := parser.ExtractReactionInfo(rawM); rxTarget != "" {
				rxSenderName := ""
				if pJID, err := types.ParseJID(senderJID); err == nil {
					rxSenderName = contacts.ResolveContactName(s, pJID, "")
				}
				for _, existing := range syncedMessages {
					if existing.ID == rxTarget {
						if rxEmoji != "" {
							existing.Reactions = append(existing.Reactions, &models.SessionReaction{
								Emoji:      rxEmoji,
								Sender:     senderJID,
								SenderName: rxSenderName,
								Count:      1,
							})
						}
						break
					}
				}
				continue
			}

			text, isFwd, media, replyToID := parser.ExtractMessageInfo(rawM)
			if text == "" && media == nil {
				continue
			}

			ts := time.Unix(int64(webMsg.GetMessageTimestamp()), 0)
			if text != "" {
				lastText = text
				lastTime = ts
			}

			senderName := ""
			if fromMe {
				senderName = "You"
			} else if isGroup {
				senderName = webMsg.GetPushName()
				if senderName == "" {
					if pJID, err := types.ParseJID(senderJID); err == nil {
						senderName = contacts.ResolveContactName(s, pJID, "")
					} else {
						senderName = senderJID
					}
				}
			} else {
				if push := webMsg.GetPushName(); push != "" {
					senderName = push
					if chatName == "Contact" || strings.HasPrefix(chatName, "+") {
						chatName = push
					}
				} else {
					senderName = chatName
				}
			}

			if media != nil {
				if dataURI, _, err := downloadMediaDataURI(s.Client, rawM, 3*time.Second); err == nil && dataURI != "" {
					media.URL = dataURI
				}
			}

			m := &models.SessionMessage{
				ID:               msgID,
				ChatID:           chatJIDStr,
				SenderID:         senderJID,
				SenderName:       senderName,
				IsFromMe:         fromMe,
				IsForwarded:      isFwd,
				Content:          text,
				Media:            media,
				ReplyToMessageID: replyToID,
				Timestamp:        ts,
				Status:           "delivered",
			}
			s.Messages[chatJIDStr] = append(s.Messages[chatJIDStr], m)
			syncedMessages = append(syncedMessages, m)
		}

		chat := &models.SessionChat{
			ID:          chatJIDStr,
			Name:        chatName,
			PhoneNumber: parsedJID.User,
			IsGroup:     isGroup,
			UnreadCount: unread,
			LastMessage: lastText,
			UpdatedAt:   lastTime,
		}
		s.Chats[chatJIDStr] = chat
		syncedChats = append(syncedChats, chat)
	}
	s.Unlock()

	webhook.SendWebhookWithTimeout(map[string]interface{}{
		"type":     "history_sync",
		"userId":   userID,
		"chats":    syncedChats,
		"messages": syncedMessages,
	}, 10*time.Second)
}
