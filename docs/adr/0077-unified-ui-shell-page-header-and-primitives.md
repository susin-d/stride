# 0077. Unified UI Shell, PageHeader, and Shared Primitives

- **Status:** Accepted
- **Date:** 2026-11-25

## Context

Across `website/src/`, pages had diverged in how they structured top-level toolbars, headings, empty states, modals, and mobile navigation:
- `AppLayout.jsx` held `sidebarOpen` state and `header-topbar.css` styled `.header-menu-btn`, but `Header.jsx` never rendered the mobile drawer trigger, leaving mobile users unable to open the navigation drawer.
- `Sidebar.jsx` rendered two separate collapse/expand buttons (`.sidebar-toggle-btn` and `.sidebar-footer-toggle`) performing the same action.
- `PageHeader` was referenced in `AGENTS.md` and `PROJECT_MAP.md` but did not exist, leading pages (`CallsPage`, `MailsPage`, `ChatsPage`, `ContactsPage`, `ThemesPage`, `ProjectDetailPage`, `HackathonDetailPage`, `UsagePage`, `WorkspaceOverview`, `EveSessionsSection`, `EveSchedulesSection`) to invent ad-hoc `.page-inline-actions`, duplicate `<h1>`/`<h2>` headings, or nested `<main>` landmarks.
- Several shared primitives had silent mismatches (`MailsPage` passing `actionLabel`/`onAction` to `EmptyState`, `UpdateSection` passing `title` instead of `heading` to `SettingsSection` and using `btn btn-primary`, `AccountSection` checking `user.name` instead of `user.fullName`, `ProfileCard` hand-rolling a modal).

## Decision

1. **Single-owner shell navigation**: Wire `onOpenSidebar` from `AppLayout` to `Header` (`.header-menu-btn`) for mobile drawers, and remove `.sidebar-toggle-btn` so `.sidebar-footer-toggle` is the sole desktop expand/collapse control.
2. **Canonical `PageHeader` primitive** (`components/ui/PageHeader.jsx` + `styles/components/page-header.css`): Top-level pages do not repeat the active route title already shown in `.topbar-page-title`; `PageHeader` renders contextual descriptions, metadata, back navigation, and actions, while `FilterBar` owns search + filters + actions on list pages.
3. **Standardize shared primitives & remove dead CSS**: Use `<EmptyState>`, `<Modal>`, `<SettingsSection>`, `<SettingsCard>`, and `<FilterBar>` consistently; remove nested `<main>` landmarks (`ContactsPage`, `EveChatSection`, `ChatsPage`), dead `.page-inline-actions` / legacy mail & contacts CSS, and unmotivated inline styles.

## Consequences

- Every route shares consistent spacing, alignment, and monochrome token styling across White and Dark modes.
- Mobile users can open the full navigation drawer from the topbar.
- `PageHeader`, `EmptyState`, `SettingsSection`, and `Modal` have single, verified prop contracts.
