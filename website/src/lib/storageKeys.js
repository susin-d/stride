// Canonical persistence keys — single source of truth for every
// localStorage/sessionStorage key in the app (ADR 0045).
//
// Rules:
// - Values are verbatim (never rename a key — stored user data depends on it).
// - Event names (CustomEvent/BroadcastChannel) are NOT here — they are not
//   persisted state. Only storage keys and storage-key prefixes live here.
// - Dynamic keys go through the helper functions below so formatting is shared.
// - Server state wins over these cached mirrors (DB is authoritative).

export const AUTH_TOKEN_KEY = 'stride_auth_token'
export const AUTH_USER_KEY = 'stride_auth_user'
export const DEVICE_ID_KEY = 'stride.device_id'
export const DEVICE_NAME_KEY = 'stride.device_name'

export const THEME_MODE_KEY = 'stride.theme'
export const CUSTOM_THEME_KEY = 'stride.custom_theme'

export const DASHBOARD_KEY = 'stride.dashboard.preferences'
export const SIDEBAR_EXPANDED_KEY = 'stride.sidebar-expanded'
export const EVE_PANEL_WIDTH_KEY = 'stride.eve-panel-width'

export const AVATAR_PREFS_KEY = 'stride:eve-avatar:v1'
export const UI_CACHE_KEY = 'stride.ui.cache'
export const OVERLAY_POSITION_KEY = 'stride.overlay-position'
export const COMPANION_EXPANDED_KEY = 'stride.avatar-companion-expanded'

export const RECENT_SEARCHES_KEY = 'stride.recent_searches'

export const IMPORTED_CALENDARS_KEY = 'stride-imported-calendars'
export const IMPORTED_EVENTS_KEY = 'stride-imported-events'
export const FIRED_REMINDERS_KEY = 'stride.fired_reminders'
export const ENABLED_PLATFORMS_KEY = 'stride-enabled-contest-platforms'

export const UPDATE_DISMISS_PREFIX = 'stride:update:dismissed:'
export const OTA_BUNDLE_KEY = 'stride:ota:bundleId'

export const GMAIL_SESSION_KEY = 'stride-gmail-authorization-v2'
export const GMAIL_ACCOUNTS_KEY = 'stride-gmail-accounts-v2'
export const GMAIL_CONNECTED_KEY = 'stride-gmail-connected'

export const CALENDAR_VIEW_KEY = 'stride.calendar.view'
export const CALENDAR_FOCUS_KEY = 'stride.calendar-focus'

export const ACTIVE_WORKSPACE_KEY = 'stride.workspace.active_id'
export const BROWSER_URL_BASE = 'stride.workspace.browser-url'

export function workspaceBrowserKey(workspaceId) {
  return `${BROWSER_URL_BASE}:${workspaceId || 'default'}`
}

export const HACKATHON_LAYOUT_KEY = 'stride-hackathon-layout'
export const HACKATHON_FOCUS_KEY = 'stride.hackathon-focus'
export const HACKATHONS_MODE_KEY = 'stride.hackathons.mode'
export const HACKATHONS_SOURCE_KEY = 'stride.hackathons.source'
export const HACKATHONS_SORT_KEY = 'stride.hackathons.sort'

export const CONTESTS_PLATFORM_KEY = 'stride.contests.platform'
export const CONTESTS_TIMEFRAME_KEY = 'stride.contests.timeframe'
export const CONTESTS_SORT_KEY = 'stride.contests.sort'

export const LOCAL_NOTIFICATIONS_KEY = 'stride.local_notifications'
export const EVE_VOICE_PREFS_KEY = 'stride.eve_voice_prefs'
export const OAUTH_EVENT_KEY = 'stride_oauth_event'

export const JOBS_STATUS_KEY = 'stride.jobs.status'
export const JOBS_WORK_TYPE_KEY = 'stride.jobs.work-type'
export const JOBS_SORT_KEY = 'stride.jobs.sort'
export const MAIL_FOLDER_KEY = 'stride.mail.folder'
export const MAIL_INBOX_TAB_KEY = 'stride.mail.inbox-tab'
export const PROJECTS_VIEW_KEY = 'stride.projects.view_mode'
export const PROJECTS_STATUS_KEY = 'stride.projects.status'
export const PROJECTS_SORT_KEY = 'stride.projects.sort'
export const TODO_FILTER_KEY = 'stride.todo.filter'

export function themeExportFilename(mode) {
  return `stride-ui-ux-${mode || 'custom'}.json`
}
