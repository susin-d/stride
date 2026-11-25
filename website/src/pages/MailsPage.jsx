import '../styles/pages/mail-shell.css'
import { useCallback, useEffect, useState } from 'react'
import {
  Bot,
  CalendarPlus,
  Check,
  Copy,
  ListTodo,
  Mail,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import {
  Alert,
  Badge,
  EmptyState,
  LoadingState,
} from '../components/ui'
import {
  deleteSchedulableEmail,
  getSchedulableWebhookInfo,
  listSchedulableEmails,
  scheduleEveFromEmail,
  scheduleTodoFromEmail,
  updateSchedulableEmail,
} from '../lib/schedulableMailApi'
import { API_URL } from '../lib/request'

function buildWebhookUrl(endpointPath = '/api/webhooks/schedulable-email') {
  const base = (API_URL || '').replace(/\/api\/v1\/?$/, '')
  if (base.startsWith('http')) {
    return `${base}${endpointPath}`
  }
  return `${window.location.origin}${endpointPath}`
}

export function MailsPage({ onNavigate }) {
  const [emails, setEmails] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [webhookInfo, setWebhookInfo] = useState({ endpoint: '/api/webhooks/schedulable-email', secret_configured: false })
  const [busyId, setBusyId] = useState('')
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [eveScheduleAt, setEveScheduleAt] = useState('')
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [items, info] = await Promise.all([
        listSchedulableEmails(),
        getSchedulableWebhookInfo().catch(() => ({ endpoint: '/api/webhooks/schedulable-email', secret_configured: false })),
      ])
      const list = Array.isArray(items) ? items : []
      setEmails(list)
      if (info) setWebhookInfo(info)
      setSelected((current) => (current ? list.find((e) => e.id === current.id) || list[0] || null : list[0] || null))
    } catch (err) {
      setError(err.message || 'Could not load schedulable emails.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(buildWebhookUrl(webhookInfo.endpoint))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setNotice('Copy failed — copy the endpoint path from Settings.')
    }
  }

  const handleScheduleTodo = async (email, target) => {
    setBusyId(email.id)
    setError('')
    setNotice('')
    try {
      const res = await scheduleTodoFromEmail(email.id, {
        title: email.subject,
        due_date: dueDate || undefined,
        target,
      })
      const updated = res?.email
      if (updated) {
        setEmails((prev) => prev.map((item) => (item.id === email.id ? updated : item)))
        setSelected(updated)
      }
      setNotice(target === 'calendar' ? 'Scheduled on Calendar (dated Todo created).' : 'Added to Todo List.')
    } catch (err) {
      setError(err.message || 'Could not schedule email.')
    } finally {
      setBusyId('')
    }
  }

  const handleScheduleEve = async (email) => {
    setBusyId(email.id)
    setError('')
    setNotice('')
    try {
      const res = await scheduleEveFromEmail(email.id, {
        title: email.subject,
        schedule_type: 'one_time',
        execute_at: eveScheduleAt ? new Date(eveScheduleAt).toISOString() : undefined,
      })
      const updated = res?.email
      if (updated) {
        setEmails((prev) => prev.map((item) => (item.id === email.id ? updated : item)))
        setSelected(updated)
      }
      setNotice('Added to Eve Scheduler.')
    } catch (err) {
      setError(err.message || 'Could not create Eve schedule.')
    } finally {
      setBusyId('')
    }
  }

  const handleDismiss = async (email) => {
    setBusyId(email.id)
    setError('')
    try {
      const updated = await updateSchedulableEmail(email.id, { status: 'dismissed' })
      setEmails((prev) => prev.map((item) => (item.id === email.id ? updated : item)))
      setSelected(updated)
    } catch (err) {
      setError(err.message || 'Could not dismiss email.')
    } finally {
      setBusyId('')
    }
  }

  const handleDelete = async (email) => {
    setBusyId(email.id)
    setError('')
    try {
      await deleteSchedulableEmail(email.id)
      setEmails((prev) => {
        const next = prev.filter((item) => item.id !== email.id)
        setSelected((cur) => (cur?.id === email.id ? next[0] || null : cur))
        return next
      })
    } catch (err) {
      setError(err.message || 'Could not delete email.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="mail-page-container">
      <div className="page-inline-actions">
        <button type="button" className="secondary-button" onClick={copyWebhookUrl}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Copied Webhook URL' : 'Copy Webhook URL'}
        </button>
        <button type="button" className="secondary-button" onClick={refresh} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'mail-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <Alert variant="error" title="Error">{error}</Alert>}
      {notice && <Alert variant="success" title="Scheduled">{notice}</Alert>}

      {loading && !emails.length ? (
        <LoadingState label="Loading incoming schedulable emails..." />
      ) : !emails.length ? (
        <EmptyState
          icon={Mail}
          title="No schedulable emails yet"
          description={`Send a POST request from Google Workspace Studio to ${webhookInfo.endpoint} with sender, subject, body, receivedAt, and isSchedulable.`}
          actionLabel="Open Webhook Settings"
          onAction={() => onNavigate('setting')}
        />
      ) : (
        <div className="mail-workspace-grid">
          <div className="mail-list-pane">
            {emails.map((email) => (
              <button
                key={email.id}
                type="button"
                className={`mail-list-row${selected?.id === email.id ? ' is-selected' : ''}`}
                onClick={() => setSelected(email)}
              >
                <div className="mail-list-row-top">
                  <span className="mail-list-sender">{email.sender}</span>
                  <Badge variant={email.status === 'scheduled' ? 'success' : 'neutral'}>
                    {email.scheduled_target || email.status}
                  </Badge>
                </div>
                <div className="mail-list-subject">{email.subject}</div>
                {email.received_at && (
                  <div className="mail-list-date">{email.received_at}</div>
                )}
              </button>
            ))}
          </div>

          {selected && (
            <div className="mail-reader-pane">
              <div className="mail-reader-header">
                <div>
                  <h2>{selected.subject}</h2>
                  <p className="mail-reader-meta">
                    From <strong>{selected.sender}</strong>
                    {selected.received_at ? ` · ${selected.received_at}` : ''}
                  </p>
                </div>
                <div className="mail-reader-status-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busyId === selected.id}
                    onClick={() => handleDismiss(selected)}
                    title="Dismiss"
                  >
                    <X size={15} /> Dismiss
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busyId === selected.id}
                    onClick={() => handleDelete(selected)}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="mail-scheduler-controls">
                <label className="mail-scheduler-field">
                  <span>Calendar / Todo Due Date</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </label>
                <label className="mail-scheduler-field">
                  <span>Eve Schedule Time (optional)</span>
                  <input
                    type="datetime-local"
                    value={eveScheduleAt}
                    onChange={(e) => setEveScheduleAt(e.target.value)}
                  />
                </label>
              </div>

              <div className="mail-scheduler-actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={busyId === selected.id}
                  onClick={() => handleScheduleTodo(selected, 'calendar')}
                >
                  <CalendarPlus size={15} /> Schedule on Calendar
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busyId === selected.id}
                  onClick={() => handleScheduleTodo(selected, 'todo')}
                >
                  <ListTodo size={15} /> Add to Todo
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busyId === selected.id}
                  onClick={() => handleScheduleEve(selected)}
                >
                  <Bot size={15} /> Add to Eve Scheduler
                </button>
              </div>

              <div className="mail-reader-body">
                <pre className="mail-reader-plaintext">{selected.body}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
