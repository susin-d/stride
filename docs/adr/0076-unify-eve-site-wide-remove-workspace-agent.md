# 0076 — Unify Eve Site-Wide & Remove Workspace Eve Agent Panel

- **Status:** Accepted
- **Date:** 2026-11-25

## Context

Stride previously exposed two separate Eve chat interfaces:
1. A Workspace-local **Eve Agent** panel (`WorkspaceEvePanel.jsx` + `useEveAgentChat.js`) inside `/app/workspace`, which had SSE streaming, tool-call indicators, model selection, `[Context]` injection (`workspace_id`, `activeFilePath`), `open_browser_url`, and automatic file-tree refresh, but used ephemeral unpersisted chats.
2. The global **Eve** side panel (`EveAssistantPanel.jsx`), modal (`EveAssistantModal.jsx`), and full page (`EvePage.jsx`), which persisted sessions (`eve_sessions`) but lacked current page/workspace context injection, SSE streaming in the side panel, and Workspace-specific action/refresh wiring. In addition, `WORKSPACE_PAGES` on the backend omitted several routes (`eve`, `calls`, `contacts`, `compete`, `themes`, `usage`), and Eve had no `list_workspaces`, `create_workspace`, or `delete_workspace_file` tools to manage code workspaces from outside `/app/workspace`.

## Decision

1. **Remove Workspace Eve Agent**: Delete `WorkspaceEvePanel.jsx`, `useEveAgentChat.js`, and `workspace-eve.css`, and remove the panel from `WorkspacePage.jsx`.
2. **Share Site Context & Actions**: Introduce `website/src/utils/eveSiteContext.js` and `website/src/utils/eveActions.js` as the single source of truth for tracking the active page, selected record IDs, and active code workspace/file, and for dispatching all Eve frontend actions (`navigate_page`, `open_record`, `open_browser_url`, `trigger_eve_call`, `apply_ui_overrides`, `reset_ui`, `open_custom_page`, and `stride:workspace-files-changed`).
3. **Upgrade Global `EveAssistantPanel`**: Switch to `streamEveMessage` (with `sendEveMessage` fallback), add thinking/tool-call indicators, a Stop button, `ModelSelectorDropdown`, site context injection, and `callCenter` support.
4. **Expand Backend Workspace & Page Coverage**: Add `eve`, `calls`, `contacts`, `compete`, `themes`, and `usage` to `WORKSPACE_PAGES` (`server/app/services/eve/constants.py`), and add `list_workspaces`, `create_workspace`, and `delete_workspace_file` tools/handlers (`tools/files.py`, `handlers/workspace_files.py`, `dispatcher.py`, `prompts.py`).

## Consequences

- Users have one unified, persistent Eve assistant across the entire site with full awareness of the active page and code workspace.
- `/app/workspace` gains full horizontal width for Explorer, Editor, Terminal, and Browser, while still refreshing automatically when global Eve modifies files or opens URLs.
- Duplicated `handleActions` logic across `EveAssistantPanel`, `EveAssistantModal`, and `EvePage` is eliminated.

## Alternatives Considered

- **Keep `WorkspaceEvePanel` and sync sessions**: Rejected because maintaining two side-by-side Eve panels on `/app/workspace` (the Workspace Eve Agent and the global Eve drawer) confused users and duplicated UI/streaming logic.
