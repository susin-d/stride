package api

import (
	"context"
	"net/http"
	"sort"
	"strings"
	"time"

	"stride-whatsapp-worker/internal/contacts"
	"stride-whatsapp-worker/internal/models"
	"stride-whatsapp-worker/internal/webhook"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
)

// Chats lists chats for the given user, populating from contacts store and enriching in background.
func (h *Handler) Chats(c *gin.Context) {
	userID := c.Param("userId")
	sess, err := h.sessions.GetOrCreate(userID)
	if err != nil || sess == nil {
		c.JSON(http.StatusOK, gin.H{"chats": []interface{}{}})
		return
	}

	if sess.Device != nil && sess.Device.Contacts != nil {
		contactsStore, err := sess.Device.Contacts.GetAllContacts(context.Background())
		if err == nil {
			sess.Lock()
			for jid := range contactsStore {
				jidStr := jid.String()
				isGroup := strings.HasSuffix(jidStr, "@g.us")
				name := contacts.ResolveChatName(sess, jid, isGroup, "")

				if existing, exists := sess.Chats[jidStr]; !exists {
					sess.Chats[jidStr] = &models.SessionChat{
						ID:          jidStr,
						Name:        name,
						PhoneNumber: jid.User,
						IsGroup:     isGroup,
						UnreadCount: 0,
						UpdatedAt:   time.Time{},
					}
				} else if (existing.Name == "" || existing.Name == "Contact" || existing.Name == jidStr || strings.HasPrefix(existing.Name, "+") || existing.Name == "Susindran") && name != "Contact" && !strings.HasPrefix(name, "+") && (!isGroup || name != "Group conversation") {
					if jid.User != sess.PhoneNumber || name == sess.PushName+" (You)" || name == "You" {
						existing.Name = name
					}
				}
			}
			sess.Unlock()
		}
	}

	sess.RLock()
	chatList := make([]*models.SessionChat, 0, len(sess.Chats))
	for _, chat := range sess.Chats {
		chatList = append(chatList, chat)
	}
	sess.RUnlock()

	sort.Slice(chatList, func(i, j int) bool {
		iHasMsg := chatList[i].LastMessage != "" && !chatList[i].UpdatedAt.IsZero()
		jHasMsg := chatList[j].LastMessage != "" && !chatList[j].UpdatedAt.IsZero()
		if iHasMsg != jHasMsg {
			return iHasMsg
		}
		if !chatList[i].UpdatedAt.Equal(chatList[j].UpdatedAt) {
			return chatList[i].UpdatedAt.After(chatList[j].UpdatedAt)
		}
		return strings.ToLower(chatList[i].Name) < strings.ToLower(chatList[j].Name)
	})

	go enrichChatsBackground(sess, userID, chatList)

	c.JSON(http.StatusOK, gin.H{"chats": chatList})
}

func enrichChatsBackground(currentSess *models.SessionState, userID string, list []*models.SessionChat) {
	if currentSess.Client == nil || !currentSess.Client.IsConnected() {
		return
	}
	for _, chat := range list {
		if chat.AvatarURL != "" && (!chat.IsGroup || len(chat.Participants) > 0) {
			continue
		}
		parsedJID, err := types.ParseJID(chat.ID)
		if err != nil {
			continue
		}
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		if chat.IsGroup || strings.HasSuffix(chat.ID, "@g.us") {
			if info, err := currentSess.Client.GetGroupInfo(ctx, parsedJID); err == nil && info != nil {
				currentSess.Lock()
				if info.GroupName.Name != "" {
					chat.Name = info.GroupName.Name
				}
				var pList []string
				for _, p := range info.Participants {
					pName := contacts.ResolveContactName(currentSess, p.JID, "")
					if pName == "Contact" || pName == "+"+p.JID.User || pName == p.JID.User {
						if currentSess.Messages != nil {
							for _, m := range currentSess.Messages[chat.ID] {
								if strings.Contains(m.SenderID, p.JID.User) && m.SenderName != "" && m.SenderName != "Contact" && m.SenderName != "1289" && !strings.HasPrefix(m.SenderName, "+") {
									pName = m.SenderName
									break
								}
							}
						}
					}
					pList = append(pList, pName)
				}
				chat.Participants = pList
				currentSess.Unlock()

				webhook.SendWebhook(map[string]interface{}{
					"type":     "history_sync",
					"userId":   userID,
					"chats":    []*models.SessionChat{chat},
					"messages": []*models.SessionMessage{},
				})
			}
		}
		if picInfo, err := currentSess.Client.GetProfilePictureInfo(ctx, parsedJID, &whatsmeow.GetProfilePictureParams{Preview: true}); err == nil && picInfo != nil && picInfo.URL != "" {
			currentSess.Lock()
			chat.AvatarURL = picInfo.URL
			currentSess.Unlock()

			webhook.SendWebhook(map[string]interface{}{
				"type":     "history_sync",
				"userId":   userID,
				"chats":    []*models.SessionChat{chat},
				"messages": []*models.SessionMessage{},
			})
		}
		cancel()
	}
}
