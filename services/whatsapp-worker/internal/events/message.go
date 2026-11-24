package events

import (
	"context"
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

func handleMessage(s *models.SessionState, userID string, v *waEvents.Message) {
	senderJID := v.Info.Sender.String()
	chatJID := v.Info.Chat.String()
	isFromMe := v.Info.IsFromMe
	isGroup := v.Info.IsGroup || strings.HasSuffix(chatJID, "@g.us")
	parsedChatJID, _ := types.ParseJID(chatJID)

	senderName := ""
	senderAvatar := ""
	if isFromMe {
		senderName = "You"
	} else {
		senderName = contacts.ResolveContactName(s, v.Info.Sender, v.Info.PushName)
		senderAvatar = contacts.ResolveAvatarURL(s, v.Info.Sender)
	}

	if rxTarget, rxEmoji := parser.ExtractReactionInfo(v.Message); rxTarget != "" {
		s.Lock()
		if msgs, ok := s.Messages[chatJID]; ok {
			for _, m := range msgs {
				if m.ID == rxTarget {
					var filtered []*models.SessionReaction
					for _, r := range m.Reactions {
						if r.Sender != senderName && r.Sender != senderJID {
							filtered = append(filtered, r)
						}
					}
					if rxEmoji != "" {
						filtered = append(filtered, &models.SessionReaction{
							Emoji:      rxEmoji,
							Sender:     senderJID,
							SenderName: senderName,
							Count:      1,
						})
					}
					m.Reactions = filtered
					break
				}
			}
		}
		s.Unlock()

		webhook.SendWebhook(map[string]interface{}{
			"type":       "message_reaction",
			"userId":     userID,
			"chatId":     chatJID,
			"messageId":  rxTarget,
			"senderId":   senderJID,
			"senderName": senderName,
			"emoji":      rxEmoji,
		})
		return
	}

	text, isFwd, media, replyToID := parser.ExtractMessageInfo(v.Message)
	if text == "" && media == nil {
		return
	}

	if media != nil {
		if dataURI, size, err := downloadMediaDataURI(s.Client, v.Message, 5*time.Second); err != nil {
			log.Printf("[User %s] Could not download media for message %s: %v", userID, v.Info.ID, err)
		} else if dataURI != "" {
			media.URL = dataURI
			log.Printf("[User %s] Successfully decrypted full-res media for message %s (%d bytes)", userID, v.Info.ID, size)
		}
	}

	s.Lock()
	msg := &models.SessionMessage{
		ID:               v.Info.ID,
		ChatID:           chatJID,
		SenderID:         senderJID,
		SenderName:       senderName,
		SenderAvatarURL:  senderAvatar,
		IsFromMe:         isFromMe,
		IsForwarded:      isFwd,
		Content:          text,
		Media:            media,
		ReplyToMessageID: replyToID,
		Timestamp:        v.Info.Timestamp,
		Status:           "delivered",
	}
	s.Messages[chatJID] = append(s.Messages[chatJID], msg)

	chatName := ""
	if chat, ok := s.Chats[chatJID]; ok {
		chat.LastMessage = text
		chat.UpdatedAt = v.Info.Timestamp
		if chat.Name == "" || chat.Name == "Contact" || chat.Name == chatJID || strings.HasPrefix(chat.Name, "+") {
			resolved := contacts.ResolveChatName(s, parsedChatJID, isGroup, "")
			if resolved != "Contact" && !strings.HasPrefix(resolved, "+") {
				chat.Name = resolved
			}
		}
		chatName = chat.Name
	} else {
		resolvedName := contacts.ResolveChatName(s, parsedChatJID, isGroup, "")
		if !isGroup && !isFromMe && senderName != "" && senderName != "Contact" && (resolvedName == "Contact" || strings.HasPrefix(resolvedName, "+")) {
			resolvedName = senderName
		}
		chatName = resolvedName
		newChat := &models.SessionChat{
			ID:          chatJID,
			Name:        resolvedName,
			PhoneNumber: parsedChatJID.User,
			IsGroup:     isGroup,
			UnreadCount: 1,
			LastMessage: text,
			UpdatedAt:   v.Info.Timestamp,
		}
		s.Chats[chatJID] = newChat

		if isGroup && s.Client != nil {
			go func(targetJID types.JID, c *models.SessionChat) {
				ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer cancel()
				info, err := s.Client.GetGroupInfo(ctx, targetJID)
				if err == nil && info != nil && info.GroupName.Name != "" {
					s.Lock()
					c.Name = info.GroupName.Name
					s.Unlock()
					webhook.SendWebhook(map[string]interface{}{
						"type":     "history_sync",
						"userId":   userID,
						"chats":    []*models.SessionChat{c},
						"messages": []*models.SessionMessage{},
					})
				}
			}(v.Info.Chat, newChat)
		}
	}
	s.Unlock()

	log.Printf("[User %s] New message from %s in %s (%s): %s", userID, senderName, chatJID, chatName, text)

	webhook.SendWebhook(map[string]interface{}{
		"type":             "new_message",
		"userId":           userID,
		"chatId":           chatJID,
		"chatName":         chatName,
		"isGroup":          isGroup,
		"senderId":         senderJID,
		"senderName":       senderName,
		"senderAvatarUrl":  senderAvatar,
		"isFromMe":         isFromMe,
		"isForwarded":      isFwd,
		"content":          text,
		"media":            media,
		"replyToMessageId": replyToID,
		"messageId":        v.Info.ID,
		"timestamp":        v.Info.Timestamp.Format(time.RFC3339),
	})
}
