/**
 * Shared Eve action & resource-refresh dispatcher used across EveAssistantPanel,
 * EveAssistantModal, and EvePage so every Eve surface can drive the entire site.
 */

const WORKSPACE_FILES_RESOURCE = 'workspace-files'
let pendingWorkspaceAction = null

export function consumePendingWorkspaceAction() {
  const action = pendingWorkspaceAction
  pendingWorkspaceAction = null
  return action
}

export async function dispatchEveActions(
  actions,
  changedResources = [],
  { onNavigate, onWorkspaceChanged, callCenter, refreshSidebar } = {},
) {
  const resources = Array.isArray(changedResources) ? changedResources : []
  if (resources.includes(WORKSPACE_FILES_RESOURCE)) {
    window.dispatchEvent(new CustomEvent('stride:workspace-files-changed'))
  }
  if (resources.length) {
    onWorkspaceChanged?.()
  }

  for (const action of actions ?? []) {
    if (action.type === 'navigate_page') {
      onNavigate?.(action.page)
    } else if (action.type === 'open_record') {
      if (action.page === 'project-detail') onNavigate?.('project-detail', action.projectId)
      else if (action.page === 'document-opener') onNavigate?.('document-opener', null, action.documentId)
      else if (action.page === 'hackathon-detail') onNavigate?.('hackathon-detail', null, null, action.hackathonId)
    } else if (action.type === 'refresh_workspace_data') {
      onWorkspaceChanged?.()
    } else if (action.type === 'open_browser_url' && action.url) {
      pendingWorkspaceAction = action
      onNavigate?.('workspace')
      window.dispatchEvent(new CustomEvent('stride:workspace-action', { detail: action }))
    } else if (action.type === 'trigger_eve_call') {
      callCenter?.requestEveCall?.('audio')
    } else if (action.type === 'refresh_eve_schedules') {
      refreshSidebar?.()
    } else if (action.type === 'apply_ui_overrides' || action.type === 'reset_ui') {
      if (action.preferences) {
        window.dispatchEvent(new CustomEvent('eve-ui-update', { detail: { preferences: action.preferences } }))
      }
    } else if (action.type === 'open_custom_page' && action.slug) {
      if (action.preferences) {
        window.dispatchEvent(new CustomEvent('eve-ui-update', { detail: { preferences: action.preferences } }))
      }
      onNavigate?.(`custom-${action.slug}`)
    }
  }

  if (resources.includes('ui-preferences') && (!actions || actions.length === 0)) {
    try {
      const { getUiPreferences } = await import('../lib/uiPreferencesApi')
      const res = await getUiPreferences()
      if (res?.preferences) {
        window.dispatchEvent(new CustomEvent('eve-ui-update', { detail: { preferences: res.preferences } }))
      }
    } catch {
      // Non-fatal UI sync failure
    }
  }
}
