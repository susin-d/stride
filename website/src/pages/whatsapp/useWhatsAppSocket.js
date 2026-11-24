import { useEffect } from 'react'
import { whatsappSocket } from '../../lib'
import { normalizeChatId } from '../../components/whatsapp/conversation/utils'

/** Whether an event belongs to the chat the user currently has open. */
function isActiveChat(chatId, selectedChatId) {
  if (!chatId) return true
  return normalizeChatId(chatId) === normalizeChatId(selectedChatId) || chatId === selectedChatId
}

function notifyIncoming(message) {
  if (message.is_from_me) return
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted' || !document.hidden) return
  new Notification(`WhatsApp: ${message.sender_name || 'WhatsApp Contact'}`, {
    body: message.content || (message.media ? `[${message.media.type}]` : 'New message'),
    icon: '/icons/icon-192.png',
  })
}

/** Merge a real message into the feed, replacing the matching optimistic one. */
function upsertMessage(prev, incoming) {
  if (prev.some((message) => message.id === incoming.id)) {
    return prev.map((message) => (message.id === incoming.id ? incoming : message))
  }
  if (incoming.is_from_me) {
    const optimisticIndex = prev.findIndex(
      (message) =>
        message.is_optimistic &&
        message.chat_id === incoming.chat_id &&
        message.content === incoming.content,
    )
    if (optimisticIndex !== -1) {
      const updated = [...prev]
      updated[optimisticIndex] = incoming
      return updated
    }
  }
  return [...prev, incoming]
}

function applyReaction(messages, event) {
  const targetMessage = event.message_id || event.messageId
  const sender = event.sender || event.senderId || 'other'
  const senderName = event.senderName || event.sender_name || null
  return messages.map((message) => {
    if (message.id !== targetMessage) return message
    const reactions = (message.reactions || []).filter(
      (reaction) =>
        reaction.sender !== sender &&
        reaction.sender_id !== sender &&
        reaction.senderId !== sender,
    )
    if (!event.emoji) return { ...message, reactions }
    reactions.push({
      emoji: event.emoji,
      sender,
      sender_id: sender,
      sender_name: senderName,
      count: 1,
    })
    return { ...message, reactions }
  })
}

function applyReceipts(messages, event) {
  const targetIds = event.messageIds || event.message_ids || []
  const status = event.status || 'delivered'
  const timestamp = event.timestamp || new Date().toISOString()
  return messages.map((message) => {
    if (!targetIds.includes(message.id)) return message
    return {
      ...message,
      status,
      read_at: status === 'read' ? message.read_at || timestamp : message.read_at,
      delivered_at:
        status === 'delivered' || status === 'read'
          ? message.delivered_at || timestamp
          : message.delivered_at,
    }
  })
}

/**
 * Subscribe to the WhatsApp socket and keep page state in sync.
 *
 * `loadChats` is called when the worker (re)connects or finishes an initial
 * sync so the list reflects what is now on the server.
 */
export function useWhatsAppSocket({
  selectedChatIdRef,
  setStatus,
  setChats,
  setNextChatsCursor,
  setHasMoreChats,
  setSelectedChatId,
  setMessages,
  setTypingState,
  setIsQrModalOpen,
  handleQrUpdate,
  loadChats,
}) {
  useEffect(() => {
    const unsubscribe = whatsappSocket.subscribe((event) => {
      if (!event || !event.type) return

      switch (event.type) {
        case 'connection_state':
        case 'status_update': {
          setStatus((prev) => ({
            ...prev,
            connected: event.connected,
            phone_number: event.phone_number,
            push_name: event.push_name,
          }))
          if (event.connected) {
            setIsQrModalOpen(false)
            loadChats()
          }
          break
        }
        case 'chats_synced': {
          loadChats()
          break
        }
        case 'qr_update': {
          handleQrUpdate(event.qr_code, event.pairing_code)
          break
        }
        case 'new_message': {
          const incoming = event.message
          if (!incoming) break
          notifyIncoming(incoming)
          const currentSelected = selectedChatIdRef.current
          if (isActiveChat(incoming.chat_id, currentSelected)) {
            setMessages((prev) => upsertMessage(prev, incoming))
          }
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === incoming.chat_id
                ? {
                    ...chat,
                    last_message: incoming,
                    unread_count:
                      incoming.chat_id === currentSelected ? 0 : (chat.unread_count || 0) + 1,
                    updated_at: incoming.timestamp,
                  }
                : chat,
            ),
          )
          break
        }
        case 'typing_indicator':
        case 'presence': {
          const targetChat = event.chatId || event.chat_id
          if (!targetChat || !isActiveChat(targetChat, selectedChatIdRef.current)) break
          const composing = Boolean(event.isTyping || event.state === 'composing')
          setTypingState(
            composing,
            event.senderName ? `${event.senderName} is typing...` : 'typing...',
          )
          break
        }
        case 'message_reaction': {
          const targetChat = event.chat_id || event.chatId
          if (!isActiveChat(targetChat, selectedChatIdRef.current)) break
          setMessages((prev) => applyReaction(prev, event))
          break
        }
        case 'receipt_update': {
          setMessages((prev) => applyReceipts(prev, event))
          break
        }
        case 'message_deleted': {
          const targetMessage = event.message_id || event.messageId
          setMessages((prev) => prev.filter((message) => message.id !== targetMessage))
          break
        }
        default:
          break
      }
    })

    return () => {
      unsubscribe()
    }
  }, [
    handleQrUpdate,
    loadChats,
    selectedChatIdRef,
    setChats,
    setHasMoreChats,
    setIsQrModalOpen,
    setMessages,
    setNextChatsCursor,
    setSelectedChatId,
    setStatus,
    setTypingState,
  ])
}

/** Replace the chat list and its pagination cursors from one API response. */
export function applyChatPage(res, { setChats, setNextChatsCursor, setHasMoreChats, setSelectedChatId }) {
  const list = Array.isArray(res) ? res : res?.items || []
  setChats(list)
  setNextChatsCursor(res?.next_cursor || null)
  setHasMoreChats(Boolean(res?.has_more))
  setSelectedChatId((current) => current || (list.length > 0 ? list[0].id : null))
}
