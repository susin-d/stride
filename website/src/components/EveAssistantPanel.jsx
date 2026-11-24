import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Bot, Maximize2, Minimize2, Play, Send, ShieldCheck, X } from 'lucide-react'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { EveModalSessions } from './eve/EveModalSessions'
import {
  createEveSession,
  deleteEveSession,
  getEveSession,
  listEveSessions,
  sendEveMessage,
} from '../lib/eveApi'
import { Markdown } from './ui/Markdown'
import { previewFor } from '../utils/evePreview'

const MAX_CHARS = 4000

/**
 * EveAssistantPanel — inline side panel that sits in the app-shell flex row
 * and pushes page content. Resizable via a drag handle on the left edge.
 */
export function EveAssistantPanel({
  onClose,
  onNavigate,
  onWorkspaceChanged,
  width,
  onResize,
  maxWidth,
}) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null)
  const [promptQueue, setPromptQueue] = useState([])
  const panelRef = useRef(null)
  const composerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const dragStartX = useRef(null)
  const dragStartWidth = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  /* Auto-scroll when messages change or typing indicator shows */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  /* Load saved sessions on mount */
  useEffect(() => {
    let cancelled = false
    setIsLoadingSessions(true)
    setError('')
    listEveSessions()
      .then(({ sessions: savedSessions }) => {
        if (cancelled) return
        setSessions(savedSessions)
        if (savedSessions.length) {
          setActiveSessionId(savedSessions[0].id)
          return getEveSession(savedSessions[0].id)
        }
        return null
      })
      .then((session) => {
        if (!cancelled) setMessages(session?.messages || [])
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSessions(false)
      })

    return () => { cancelled = true }
  }, [])

  /* Focus composer on open */
  useEffect(() => {
    window.requestAnimationFrame(() => composerRef.current?.focus())
  }, [])

  /* Escape closes panel */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  /* ── Drag resize ── */
  const handleDragStart = useCallback((event) => {
    event.preventDefault()
    dragStartX.current = event.clientX
    dragStartWidth.current = panelRef.current?.offsetWidth ?? width

    const handleMouseMove = (moveEvent) => {
      const delta = dragStartX.current - moveEvent.clientX
      onResize(dragStartWidth.current + delta)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [onResize, width])

  /* ── Session management ── */
  const startNewChat = () => {
    if (isSending) return
    setError('')
    setActiveSessionId(null)
    setMessages([])
    setDraft('')
    setPromptQueue([])
  }

  const selectSession = async (sessionId) => {
    if (sessionId === activeSessionId || isSending) return
    setError('')
    setActiveSessionId(sessionId)
    try {
      const session = await getEveSession(sessionId)
      setMessages(session?.messages || [])
      setDraft('')
      setPromptQueue([])
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const confirmDeleteSession = async () => {
    const sessionId = sessionToDelete?.id
    setSessionToDelete(null)
    if (!sessionId) return
    try {
      await deleteEveSession(sessionId)
    } catch (requestError) {
      setError(requestError.message)
      return
    }
    const remaining = sessions.filter((session) => session.id !== sessionId)
    setSessions(remaining)
    if (sessionId !== activeSessionId) return
    if (remaining.length) {
      const nextSession = remaining[0]
      setActiveSessionId(nextSession.id)
      try {
        const session = await getEveSession(nextSession.id)
        setMessages(session?.messages || [])
      } catch {
        setMessages([])
      }
    } else {
      setActiveSessionId(null)
      setMessages([])
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content) return
    if (isSending) {
      setPromptQueue((current) => [...current, content])
      setDraft('')
      return
    }
    setError('')
    setIsSending(true)
    try {
      await sendPrompt(content, messages, activeSessionId)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSending(false)
    }
  }

  const sendPrompt = async (content, baseMessages, sessionIdOverride = null) => {
    const trimmed = typeof content === 'string' ? content.trim() : content
    if (!trimmed) return { messages: baseMessages, sessionId: sessionIdOverride }
    const sanitizedBase = Array.isArray(baseMessages) ? baseMessages.filter((m) => typeof m.content === 'string' && m.content.trim().length > 0) : baseMessages
    const nextMessages = [...sanitizedBase, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setDraft('')
    setError('')
    let nextSessionId = sessionIdOverride
    let sessionTitle = sessions.find((session) => session.id === nextSessionId)?.title ?? 'New chat'
    if (!nextSessionId) {
      const created = await createEveSession(nextMessages)
      nextSessionId = created.session.id
      sessionTitle = created.session.title
      setActiveSessionId(nextSessionId)
      setSessions((current) => [
        { id: nextSessionId, title: sessionTitle, updated_at: created.session.updated_at, preview: previewFor(nextMessages) },
        ...current,
      ])
    }
    const apiMessages = nextMessages.filter((m) => typeof m.content === 'string' && m.content.trim().length > 0).map((m) => ({ role: m.role, content: m.content.trim() }))
    const response = await sendEveMessage(apiMessages.length ? apiMessages : nextMessages, nextSessionId, null)
    const assistantText = typeof response.message === 'string' ? response.message.trim() : ''
    const assistantMessage = assistantText ? { role: 'assistant', content: assistantText } : null
    const finalMessages = assistantMessage ? [...nextMessages, assistantMessage] : nextMessages
    setMessages(finalMessages)
    setSessions((current) => [
      { id: nextSessionId, title: sessionTitle, updated_at: new Date().toISOString(), preview: previewFor(finalMessages) },
      ...current.filter((session) => session.id !== nextSessionId),
    ])
    if (response.changed_resources.length) onWorkspaceChanged()
    handleActions(response.actions ?? [])
    return { messages: finalMessages, sessionId: nextSessionId }
  }

  const removeFromQueue = (index) => {
    setPromptQueue((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const clearQueue = () => setPromptQueue([])

  const runQueue = async () => {
    if (isSending || !promptQueue.length) return
    const queuedPrompts = [...promptQueue]
    setPromptQueue([])
    setError('')
    setIsSending(true)
    let conversation = messages
    let nextSessionId = activeSessionId
    try {
      for (const prompt of queuedPrompts) {
        const result = await sendPrompt(prompt, conversation, nextSessionId)
        conversation = result.messages
        nextSessionId = result.sessionId
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSending(false)
    }
  }

  const handleActions = (actions) => {
    actions.forEach((action) => {
      if (action.type === 'navigate_page') {
        onNavigate?.(action.page)
      } else if (action.type === 'open_record') {
        if (action.page === 'project-detail') onNavigate?.('project-detail', action.projectId)
        if (action.page === 'document-opener') onNavigate?.('document-opener', null, action.documentId)
      } else if (action.type === 'refresh_workspace_data') {
        onWorkspaceChanged()
      } else if (action.type === 'apply_ui_overrides' || action.type === 'reset_ui') {
        if (action.preferences) window.dispatchEvent(new CustomEvent('eve-ui-update', { detail: { preferences: action.preferences } }))
      } else if (action.type === 'open_custom_page' && action.slug) {
        if (action.preferences) window.dispatchEvent(new CustomEvent('eve-ui-update', { detail: { preferences: action.preferences } }))
        onNavigate?.(`custom-${action.slug}`)
      }
    })
  }

  const charProgress = draft.length / MAX_CHARS
  const panelStyle = { width: isExpanded ? Math.min(maxWidth, window.innerWidth * 0.7) : width }

  return (
    <aside
      ref={panelRef}
      className="eve-assistant-panel eve-assistant-panel--inline"
      role="complementary"
      aria-label="Eve AI assistant"
      aria-labelledby={titleId}
      style={panelStyle}
    >
      {/* ── Drag resize handle ── */}
      <div
        className="eve-panel-resize-handle"
        onMouseDown={handleDragStart}
        role="separator"
        aria-label="Drag to resize Eve panel"
        aria-orientation="vertical"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') onResize(width + 20)
          if (e.key === 'ArrowRight') onResize(width - 20)
        }}
      />

      {/* ── Header ── */}
      <header className="eve-panel-header">
        <div className="eve-panel-heading">
          <div className="eve-panel-avatar" aria-hidden="true"><Bot size={22} /></div>
          <div>
            <h2 id={titleId}>Eve</h2>
            <p id={descriptionId}>AI workspace assistant</p>
          </div>
        </div>
        <div className="eve-panel-controls">
          <span className="eve-status"><span className="eve-status-dot" />Connected</span>
          <button
            className="icon-button"
            type="button"
            onClick={() => setIsExpanded((e) => !e)}
            aria-label={isExpanded ? 'Reduce Eve assistant width' : 'Expand Eve assistant'}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close Eve assistant">
            <X size={16} />
          </button>
        </div>
      </header>

      <EveModalSessions
        sessions={sessions}
        activeSessionId={activeSessionId}
        isLoadingSessions={isLoadingSessions}
        onNewChat={startNewChat}
        onSelectSession={selectSession}
        onDeleteSession={setSessionToDelete}
      />

      {/* ── Context Banner ── */}
      <div className="eve-context-banner" aria-label="Eve workspace access">
        <ShieldCheck size={14} />
        <span>Private workspace access — your integrations and secrets stay protected.</span>
      </div>

      {/* ── Conversation Body ── */}
      <div className="eve-panel-body">
        <div className="eve-messages" aria-live="polite" aria-label="Eve conversation">
          {messages.map((message, index) => (
            <div className={`eve-message ${message.role}`} key={`${message.role}-${index}`}>
              {message.role === 'assistant' ? (
                <div className="eve-message-md">
                  <Markdown content={message.content} />
                </div>
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          ))}
          {isSending && (
            <div className="eve-message assistant">
              <p>
                <span className="eve-typing-dots" aria-label="Eve is thinking">
                  <span /><span /><span />
                </span>
              </p>
            </div>
          )}
          {error && <p className="eve-error" role="alert">{error}</p>}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </div>

      {/* ── Composer ── */}
      <form className="eve-composer" onSubmit={handleSubmit}>
        {promptQueue.length > 0 && (
          <div className="eve-queue-strip" aria-label="Queued messages">
            <div className="eve-queue-list">
              {promptQueue.map((queuedPrompt, index) => (
                <span className="eve-queue-item" key={`${queuedPrompt}-${index}`}>
                  <span className="eve-queue-item-text">{queuedPrompt}</span>
                  <button
                    className="eve-queue-item-remove"
                    type="button"
                    onClick={() => removeFromQueue(index)}
                    aria-label="Remove queued message"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <button className="eve-queue-clear" type="button" onClick={clearQueue}>
              Clear queue
            </button>
          </div>
        )}
        <div className="eve-composer-field">
          <label className="eve-composer-label" htmlFor="eve-message">Message Eve</label>
          <textarea
            ref={composerRef}
            id="eve-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder="Ask anything…"
            rows="2"
            maxLength={MAX_CHARS}
          />
          <div className="eve-composer-footer">
            <span className="eve-composer-hint">{isSending ? '⏎ to queue' : '⏎ to send'}</span>
            <div className="eve-composer-actions">
              {promptQueue.length > 0 && (
                <button className="eve-queue-run" type="button" onClick={runQueue} disabled={isSending}>
                  <Play size={13} />
                  Run queue ({promptQueue.length})
                </button>
              )}
              <button className="eve-send-button" type="submit" disabled={!draft.trim()} aria-label={isSending ? 'Queue message' : 'Send message'}>
                <Send size={15} />
              </button>
            </div>
          </div>
          <div className="eve-char-bar" style={{ '--char-progress': charProgress }} />
        </div>
      </form>

      <ConfirmDialog
        isOpen={Boolean(sessionToDelete)}
        title="Delete Eve conversation"
        message={`Delete "${sessionToDelete?.title ?? ''}"? This conversation will be permanently removed.`}
        confirmLabel="Delete conversation"
        onConfirm={confirmDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />
    </aside>
  )
}
