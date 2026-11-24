import { useEffect, useMemo } from 'react'
import { usePersistentState } from './usePersistentState'
import { notify } from '../utils/browserNotifications'
import { buildCalendarEventIndex } from '../utils/calendarEvents'
import { buildCalendarReminders, CALENDAR_REMINDER_PREFIX } from '../utils/calendarReminders'
import {
  FIRED_REMINDERS_KEY,
  IMPORTED_CALENDARS_KEY,
  IMPORTED_EVENTS_KEY,
} from '../lib/storageKeys'

export function useCalendarData({
  tasks,
  contestSites,
  hackathons,
  projects,
  jobs,
  googleCalendarEvents,
  setNotifications,
}) {
  const [importedIcsCalendars, setImportedIcsCalendars] = usePersistentState(
    IMPORTED_CALENDARS_KEY,
    [],
  )
  const [importedIcsEvents, setImportedIcsEvents] = usePersistentState(
    IMPORTED_EVENTS_KEY,
    [],
  )
  const [firedReminderIds, setFiredReminderIds] = usePersistentState(
    FIRED_REMINDERS_KEY,
    [],
  )

  const calendarEventIndex = useMemo(
    () =>
      buildCalendarEventIndex({
        tasks,
        contestSites,
        hackathons,
        projects,
        jobs,
        googleCalendarEvents,
        icsCalendarEvents: importedIcsEvents,
      }),
    [tasks, contestSites, hackathons, projects, jobs, googleCalendarEvents, importedIcsEvents],
  )

  useEffect(() => {
    let timer

    const syncReminders = () => {
      if (document.hidden) return
      const generated = buildCalendarReminders(calendarEventIndex)
      const activeReminderIds = new Set(generated.map((reminder) => reminder.id))
      const newHourlyReminders = generated.filter(
        (reminder) =>
          reminder.id.endsWith('-1-hour') && !firedReminderIds.includes(reminder.id),
      )
      if (newHourlyReminders.length > 0) {
        newHourlyReminders.forEach((reminder) =>
          notify(reminder.title, `${reminder.message} (${reminder.time})`, reminder.id),
        )
        setFiredReminderIds((current) => [
          ...new Set([
            ...current.filter((id) => activeReminderIds.has(id)),
            ...newHourlyReminders.map((reminder) => reminder.id),
          ]),
        ])
      }
      setNotifications((current) => {
        const existingById = new Map(
          current.map((notification) => [notification.id, notification]),
        )
        const saved = current.filter(
          ({ id }) => !id.startsWith(CALENDAR_REMINDER_PREFIX),
        )
        const reminders = generated.map((notification) => ({
          ...notification,
          unread: existingById.get(notification.id)?.unread ?? true,
        }))
        return [...reminders, ...saved]
      })
    }

    syncReminders()
    const startTimer = () => {
      if (!document.hidden && !timer) timer = window.setInterval(syncReminders, 60 * 1000)
    }
    const stopTimer = () => {
      if (timer) {
        window.clearInterval(timer)
        timer = undefined
      }
    }
    const handleVisibilityChange = () => {
      if (document.hidden) stopTimer()
      else {
        syncReminders()
        startTimer()
      }
    }

    startTimer()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      stopTimer()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [calendarEventIndex, firedReminderIds, setFiredReminderIds, setNotifications])

  return {
    importedIcsCalendars,
    setImportedIcsCalendars,
    importedIcsEvents,
    setImportedIcsEvents,
    calendarEventIndex,
  }
}
