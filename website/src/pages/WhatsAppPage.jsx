import { useEffect, useRef, useState } from 'react'
import {
  fetchWhatsAppStatus,
  fetchWhatsAppChats,
  fetchWhatsAppMessages,
  markWhatsAppChatRead,
} from '../lib'
import { applyChatPage, useWhatsAppSocket } from './whatsapp/useWhatsAppSocket'
import { normalizeChatId } from '../components/whatsapp/conversation/utils'
import { WhatsAppChatList } from '../components/whatsapp/WhatsAppChatList'
import { WhatsAppConversation } from '../components/whatsapp/WhatsAppConversation'
import { WhatsAppQrModal } from '../components/whatsapp/WhatsAppQrModal'
import { WhatsAppInfoDrawer } from '../components/whatsapp/WhatsAppInfoDrawer'
import { WhatsAppSummaryModal } from '../components/whatsapp/WhatsAppSummaryModal'
import { useWhatsAppMessageActions } from './whatsapp/useWhatsAppMessageActions'
import { useWhatsAppPairing } from './whatsapp/useWhatsAppPairing'
import { WhatsAppEmptyPane } from './whatsapp/WhatsAppEmptyPane'
import '../styles/pages/whatsapp-shell.css'
import '../styles/pages/whatsapp-sync.css'
import '../styles/pages/whatsapp-polish.css'

const TYPING_TIMEOUT_MS = 5000
const MESSAGE_PAGE_SIZE = 50

/** Filter a message page to the selected chat, tolerating JID suffix variants. */
function messagesForChat(messages, chatId) {
  const cleanSelected = normalizeChatId(chatId)
  return (messages || []).filter((message) => {
    if (!message.chat_id) return true
    return normalizeChatId(message.chat_id) === cleanSelected || message.chat_id === chatId
  })
}

export function WhatsAppPage() {
  const [status, setStatus] = useState({ connected: false })
  const [chats, setChats] = useState([])
  const [nextChatsCursor, setNextChatsCursor] = useState(null)
  const [hasMoreChats, setHasMoreChats] = useState(false)
  const [isLoadingMoreChats, setIsLoadingMoreChats] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState(null)
  const selectedChatIdRef = useRef(null)
  selectedChatIdRef.current = selectedChatId

  const [messages, setMessages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false)
  const [isDrafting, setIsDrafting] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryModalText, setSummaryModalText] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingText, setTypingText] = useState('')

  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const typingTimerRef = useRef(null)

  const {
    handleSendMessage,
    handleGenerateEveDraft,
    handleSummarizeChat,
    handleReactToMessage,
    handleStarMessage,
    handleDeleteMessage,
    handleTogglePinChat,
    handleToggleMuteChat,
    handleToggleArchiveChat,
    handleDeleteChat,
    handleMarkChatRead,
  } = useWhatsAppMessageActions({
    setMessages,
    setChats,
    setSelectedChatId,
    selectedChatId,
    setSummaryModalText,
    setIsDrafting,
    setIsSummarizing,
  })

  const {
    pairingData,
    isQrLoading,
    handleQrUpdate,
    handleOpenQrModal,
    handleRequestPairingCode,
    handleCheckStatus,
  } = useWhatsAppPairing({
    status,
    setStatus,
    setChats,
    setSelectedChatId,
    isQrModalOpen,
    setIsQrModalOpen,
  })

  // Request browser notifications permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  const loadInitialData = async () => {
    try {
      const stat = await fetchWhatsAppStatus().catch(() => ({ connected: false }))
      setStatus(stat)

      const chatRes = await fetchWhatsAppChats({ limit: 30 }).catch(() => ({ items: [], next_cursor: null, has_more: false }))
      const chatList = Array.isArray(chatRes) ? chatRes : (chatRes?.items || [])
      setChats(chatList)
      setNextChatsCursor(chatRes?.next_cursor || null)
      setHasMoreChats(Boolean(chatRes?.has_more))
      const initialChatId = chatList.length > 0 ? chatList[0].id : null
      setSelectedChatId((current) => current || initialChatId)

      if (initialChatId) {
        try {
          const initialMsgs = await fetchWhatsAppMessages(initialChatId, MESSAGE_PAGE_SIZE)
          const validMsgs = messagesForChat(initialMsgs, initialChatId)
          setMessages(validMsgs)
          setHasMoreMessages(validMsgs.length >= MESSAGE_PAGE_SIZE)
          markWhatsAppChatRead(initialChatId).catch(() => {})
        } catch {
          // Non-fatal: messages will be loaded by effect
        }
      }
    } catch (err) {
      console.error('WhatsApp initial load error:', err)
    }
  }

  const handleLoadMoreChats = async () => {
    if (isLoadingMoreChats || !hasMoreChats || !nextChatsCursor) return
    setIsLoadingMoreChats(true)
    try {
      const res = await fetchWhatsAppChats({ limit: 30, cursor: nextChatsCursor })
      const newItems = Array.isArray(res) ? res : (res?.items || [])
      setChats((prev) => {
        const existingIds = new Set(prev.map((c) => c.id))
        const filtered = newItems.filter((c) => !existingIds.has(c.id))
        return [...prev, ...filtered]
      })
      setNextChatsCursor(res?.next_cursor || null)
      setHasMoreChats(Boolean(res?.has_more))
    } catch (err) {
      console.error('Failed to load more WhatsApp chats:', err)
      setHasMoreChats(false)
    } finally {
      setIsLoadingMoreChats(false)
    }
  }

  const loadChats = () => {
    fetchWhatsAppChats({ limit: 30 })
      .then((res) =>
        applyChatPage(res, {
          setChats,
          setNextChatsCursor,
          setHasMoreChats,
          setSelectedChatId,
        }),
      )
      .catch(() => {})
  }

  const setTypingState = (isComposing, text) => {
    setIsTyping(isComposing)
    setTypingText(text)
    if (!isComposing) return
    // Clear the indicator if the worker stops sending composing events.
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => setIsTyping(false), TYPING_TIMEOUT_MS)
  }

  useWhatsAppSocket({
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
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    loadInitialData()
    // Initial load and the notification permission prompt run once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!chats.length) {
      if (selectedChatId !== null) {
        setSelectedChatId(null)
      }
      return
    }

    const hasSelectedChat = chats.some((chat) => chat.id === selectedChatId)
    if (!selectedChatId || !hasSelectedChat) {
      setSelectedChatId(chats[0].id)
    }
  }, [chats, selectedChatId])

  // Load messages when selectedChatId changes — pages only after all new messages synced
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([])
      setHasMoreMessages(false)
      return
    }

    const hasMessagesForChat =
      messages.length > 0 && messagesForChat(messages, selectedChatId).length > 0
    if (hasMessagesForChat && selectedChatIdRef.current === selectedChatId) {
      // Messages already synced for this chat — keep them, just ensure pagination reflects limit
      if (messages.length >= MESSAGE_PAGE_SIZE) setHasMoreMessages(true)
      return
    }

    // Immediately clear previous chat messages so they do not leak into newly selected chat
    setMessages([])
    setHasMoreMessages(true)

    let isCurrent = true
    fetchWhatsAppMessages(selectedChatId, MESSAGE_PAGE_SIZE)
      .then((msgs) => {
        if (isCurrent && selectedChatIdRef.current === selectedChatId) {
          const validMsgs = messagesForChat(msgs, selectedChatId)
          setMessages(validMsgs)
          setHasMoreMessages(validMsgs.length >= MESSAGE_PAGE_SIZE)
          markWhatsAppChatRead(selectedChatId).catch(() => {})
          setChats((prev) =>
            prev.map((c) => (c.id === selectedChatId ? { ...c, unread_count: 0 } : c)),
          )
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.error('Could not load messages:', err)
          setMessages([])
          setHasMoreMessages(false)
        }
      })

    return () => {
      isCurrent = false
    }
    // Messages are intentionally excluded: this effect owns the initial load
    // for each selected chat and also updates the messages state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatId])

  const handleLoadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || messages.length === 0 || !selectedChatId) return
    setIsLoadingMore(true)
    try {
      const sorted = [...messages].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
      const earliestMsg = sorted[0]
      const beforeTimestamp = earliestMsg?.timestamp
      // Server now syncs all new messages BEFORE paging, so beforeTimestamp pagination is correct
      const olderMsgs = await fetchWhatsAppMessages(selectedChatId, MESSAGE_PAGE_SIZE, beforeTimestamp)
      const validOlder = messagesForChat(olderMsgs, selectedChatId)
      if (validOlder.length === 0) {
        setHasMoreMessages(false)
      } else {
        // If server returned less than full page, no more older messages after this
        const hasMore = validOlder.length >= MESSAGE_PAGE_SIZE
        setMessages((prev) => {
          const prevIds = new Set(prev.map((m) => m.id))
          const fresh = validOlder.filter((m) => !prevIds.has(m.id))
          if (fresh.length === 0) {
            setHasMoreMessages(false)
            return prev
          }
          if (!hasMore) setHasMoreMessages(false)
          else if (fresh.length < validOlder.length) {
            // Some duplicates — still keep hasMore based on server response
            setHasMoreMessages(hasMore)
          } else {
            setHasMoreMessages(hasMore)
          }
          return [...fresh, ...prev]
        })
        if (!hasMore) setHasMoreMessages(false)
      }
    } catch (err) {
      console.error('Failed to load older WhatsApp messages:', err)
      setHasMoreMessages(false)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const selectedChat = chats.find((c) => c.id === selectedChatId)

  return (
    <>
      <div className="whatsapp-page">
        <WhatsAppChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          onOpenQrModal={handleOpenQrModal}
          onTogglePinChat={handleTogglePinChat}
          onToggleMuteChat={handleToggleMuteChat}
          onToggleArchiveChat={handleToggleArchiveChat}
          onDeleteChat={handleDeleteChat}
          onMarkChatRead={handleMarkChatRead}
          isConnected={status.connected}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          hasMoreChats={hasMoreChats}
          isLoadingMoreChats={isLoadingMoreChats}
          onLoadMoreChats={handleLoadMoreChats}
        />

        {selectedChat ? (
          <WhatsAppConversation
            key={selectedChat.id}
            chat={selectedChat}
            allChats={chats}
            messages={messages}
            hasMoreMessages={hasMoreMessages}
            isLoadingMore={isLoadingMore}
            onLoadMoreMessages={handleLoadMoreMessages}
            onSendMessage={handleSendMessage}
            onOpenInfoDrawer={() => setIsInfoDrawerOpen(true)}
            onToggleInfoDrawer={() => setIsInfoDrawerOpen((prev) => !prev)}
            onGenerateEveDraft={handleGenerateEveDraft}
            onSummarizeChat={handleSummarizeChat}
            onReactToMessage={handleReactToMessage}
            onStarMessage={handleStarMessage}
            onDeleteMessage={handleDeleteMessage}
            isDrafting={isDrafting}
            isSummarizing={isSummarizing}
            isTyping={isTyping}
            typingText={typingText}
          />
        ) : (
          <WhatsAppEmptyPane connected={status.connected} onLink={handleOpenQrModal} />
        )}

        {isInfoDrawerOpen && selectedChat && (
          <WhatsAppInfoDrawer
            chat={selectedChat}
            messages={messages}
            onClose={() => setIsInfoDrawerOpen(false)}
            onSummarizeChat={handleSummarizeChat}
            onToggleEveAutoReply={(chatId, enabled) => {
              setChats((prev) =>
                prev.map((c) => (c.id === chatId ? { ...c, eve_auto_reply: enabled } : c)),
              )
            }}
          />
        )}
      </div>

      <WhatsAppQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        qrCode={pairingData.qr_code}
        pairingCode={pairingData.pairing_code}
        onRefresh={handleOpenQrModal}
        onRequestPairingCode={handleRequestPairingCode}
        onCheckStatus={handleCheckStatus}
        loading={isQrLoading}
      />

      <WhatsAppSummaryModal
        isOpen={Boolean(summaryModalText)}
        onClose={() => setSummaryModalText(null)}
        summary={summaryModalText}
        chatId={selectedChatId}
        chatName={selectedChat?.name || 'this conversation'}
      />
    </>
  )
}
