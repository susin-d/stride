import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell,
  BellOff,
  BriefcaseBusiness,
  CalendarDays,
  CheckCheck,
  FolderKanban,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'
import { deleteNotification, markAllNotificationsRead } from '../../lib/workspaceApi'
import { CALENDAR_REMINDER_PREFIX } from '../../utils/calendarReminders'
import { CALENDAR_FOCUS_KEY } from '../../lib/storageKeys'

const notificationIcons = {
  calendar: CalendarDays,
  contest: Trophy,
  project: FolderKanban,
  job: BriefcaseBusiness,
  call: Phone,
  call_incoming: PhoneIncoming,
  call_missed: PhoneMissed,
  call_declined: PhoneOff,
}

const notificationDestinations = {
  calendar: 'calendar',
  contest: 'compete',
  project: 'projects',
  job: 'jobs',
  hackathon: 'hackathons',
  task: 'todo',
  call: 'calls',
  call_incoming: 'calls',
  call_missed: 'calls',
  call_declined: 'calls',
}

export function NotificationsPopover({
  isOpen,
  onClose,
  notifications,
  setNotifications,
  unreadCount,
  permissionStatus,
  onRequestPermission,
  onNavigate,
  canLoadMore,
  loading,
  onLoadMore,
}) {
  const [filter, setFilter] = useState('all')

  if (!isOpen) return null

  const visibleNotifications =
    filter === 'unread'
      ? notifications.filter((item) => item.unread)
      : notifications

  const openNotification = (notification) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, unread: false } : item,
      ),
    )
    onClose()

    const destination =
      notification.destination ?? notificationDestinations[notification.type]
    if (!destination) return

    if (destination === 'calendar' && notification.targetId && notification.dateKey) {
      localStorage.setItem(
        CALENDAR_FOCUS_KEY,
        JSON.stringify({ targetId: notification.targetId, dateKey: notification.dateKey }),
      )
    }
    onNavigate(destination)
    if (notification.targetId) {
      window.setTimeout(() => {
        const target = document.querySelector(
          `[data-record-id="${CSS.escape(notification.targetId)}"]`,
        )
        if (!target) return
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target.classList.add('notification-target-highlight')
        window.setTimeout(() => target.classList.remove('notification-target-highlight'), 1600)
      }, 120)
    }
  }

  const handleMarkAllRead = () => {
    markAllNotificationsRead().catch((err) => console.error(err))
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false })),
    )
  }

  const handleDeleteNotification = (event, notificationId) => {
    event.stopPropagation()
    if (!notificationId.startsWith(CALENDAR_REMINDER_PREFIX)) {
      deleteNotification(notificationId).catch((err) => console.error(err))
    }
    setNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    )
  }

  return createPortal(
    <div
      className="notification-backdrop"
      onMouseDown={onClose}
      role="presentation"
    >
      <aside
        className="notification-panel"
        aria-label="Notifications"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="notification-panel-header">
          <div className="notification-header-title">
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="notification-header-badge">{unreadCount}</span>
            )}
          </div>
          <div className="notification-header-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-mark-read"
                onClick={handleMarkAllRead}
                title="Mark all as read"
              >
                <CheckCheck size={14} aria-hidden="true" />
                <span>Mark read</span>
              </button>
            )}
            <button
              type="button"
              className="notification-close-btn"
              onClick={onClose}
              aria-label="Close notifications"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="notification-tabs" role="tablist" aria-label="Filter notifications">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={filter === 'all' ? 'is-active' : ''}
            onClick={() => setFilter('all')}
          >
            All
            <span>{notifications.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'unread'}
            className={filter === 'unread' ? 'is-active' : ''}
            onClick={() => setFilter('unread')}
          >
            Unread
            <span>{unreadCount}</span>
          </button>
        </div>

        {permissionStatus === 'default' && (
          <div className="notification-permission-banner">
            <div className="permission-banner-text">
              <Bell size={14} aria-hidden="true" />
              <span>Enable desktop alerts for reminders &amp; calls.</span>
            </div>
            <button
              type="button"
              className="permission-banner-button"
              onClick={onRequestPermission}
            >
              Enable
            </button>
          </div>
        )}

        <div className="notification-list">
          {visibleNotifications.length === 0 ? (
            <div className="notification-empty">
              <span className="notification-empty-icon">
                {filter === 'unread' ? <CheckCheck size={20} aria-hidden="true" /> : <BellOff size={20} aria-hidden="true" />}
              </span>
              <strong>{filter === 'unread' ? 'No unread alerts' : 'All caught up'}</strong>
              <p>
                {filter === 'unread'
                  ? 'Everything in your inbox has been read.'
                  : 'Reminders, calls, and deadline updates will appear here.'}
              </p>
            </div>
          ) : (
            visibleNotifications.map((notification) => {
              const NotificationIcon = notificationIcons[notification.type] ?? Bell
              return (
                <div
                  className={`notification-item ${notification.unread ? 'unread' : ''}`}
                  key={notification.id}
                >
                  <button
                    type="button"
                    className="notification-main"
                    onClick={() => openNotification(notification)}
                  >
                    <span className="notification-icon">
                      <NotificationIcon size={16} aria-hidden="true" />
                    </span>
                    <span className="notification-copy">
                      <span className="notification-title-row">
                        <strong>{notification.title}</strong>
                        {notification.unread && (
                          <span className="notification-unread-dot" aria-label="Unread" />
                        )}
                        <small>{notification.time}</small>
                      </span>
                      {notification.message && (
                        <span className="notification-message">{notification.message}</span>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                    title="Dismiss notification"
                    className="notification-dismiss"
                    aria-label={`Dismiss ${notification.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {canLoadMore && (
          <div className="notification-panel-footer">
            <button
              className="secondary-button"
              type="button"
              onClick={onLoadMore}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </aside>
    </div>,
    document.body,
  )
}
