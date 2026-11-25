/**
 * Shared site-context store for Eve so the global assistant knows what page,
 * record, or code workspace the user is currently viewing.
 */

const siteContext = {
  activePage: 'dashboard',
  selectedProjectId: null,
  selectedDocumentId: null,
  selectedHackathonId: null,
  workspaceId: null,
  workspaceName: '',
  activeFilePath: '',
}

export function setSiteContext(patch) {
  Object.assign(siteContext, patch)
}

export function clearWorkspaceSiteContext() {
  siteContext.workspaceId = null
  siteContext.workspaceName = ''
  siteContext.activeFilePath = ''
}

export function getSiteContext() {
  return { ...siteContext }
}

/**
 * Build a concise [Context] block prepended to the outgoing API message
 * (never shown in the user's visible chat bubble).
 */
export function buildSiteContextPrefix() {
  const lines = [`[Context] Current page: ${siteContext.activePage || 'dashboard'}`]
  if (siteContext.selectedProjectId) {
    lines.push(`[Context] Open project ID: ${siteContext.selectedProjectId}`)
  }
  if (siteContext.selectedDocumentId) {
    lines.push(`[Context] Open document ID: ${siteContext.selectedDocumentId}`)
  }
  if (siteContext.selectedHackathonId) {
    lines.push(`[Context] Open hackathon ID: ${siteContext.selectedHackathonId}`)
  }
  if (siteContext.workspaceId) {
    const label = siteContext.workspaceName ? `"${siteContext.workspaceName}" ` : ''
    lines.push(
      `[Context] Active code workspace: ${label}(workspace_id: ${siteContext.workspaceId}). Pass this exact workspace_id to workspace file tools.`,
    )
    if (siteContext.activeFilePath) {
      lines.push(`[Context] File currently open in the editor: ${siteContext.activeFilePath}`)
    }
  }
  return lines.join('\n')
}
