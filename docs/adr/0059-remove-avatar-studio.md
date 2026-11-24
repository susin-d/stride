# ADR 0059 — Remove the Avatar Studio modeling workspace

## Status

Accepted

- Date: 2026-11-24
- Deciders: user ("remove Avatar Studio page", scoped to the whole feature)
- Tags: `frontend`, `backend`, `feature-removal`, `eve`
- Supersedes/retires [ADR 0033](./0033-avatar-studio-framing-and-pan-zoom.md), [ADR 0034](./0034-avatar-modeling-studio-projects.md), [ADR 0039](./0039-avatar-studio-editor-state-and-capabilities.md), [ADR 0040](./0040-avatar-studio-eve-editor-actions.md), [ADR 0047](./0047-avatar-studio-zoom-fix.md)

## Context

Avatar Studio (`/app/avatar`) started as an Eve model preview surface (ADR 0033), was rebuilt into a versioned 3D modeling workspace (ADR 0034) with a normalized scene schema, capability-aware tools, timeline and texture painting (ADR 0039), and gained a validated Eve→editor action protocol (ADR 0040, 0047). It accumulated a dedicated page package (18 files), a filesystem-backed project API (`/modeling/projects`), a repository/service/schema trio, and a `editor_context` channel threaded from the browser through both Eve chat endpoints into the system prompt.

The user asked to remove the page. The feature is self-contained (it is not the Eve Avatar companion, which stays), but leaving either half behind would leave dead code: the page is the only producer of `editor_context`, the only dispatcher of `stride:avatar-editor-context`/`avatar_editor_action`, the only consumer of the `avatar_editor_action` tool, and the only caller of the modeling API. Retaining the API without a UI would keep an unauthenticated-in-practice surface plus its tests alive for no caller.

## Decision

Remove the feature end to end.

- **Frontend:** delete `pages/avatar-studio/` (incl. its two vitest files), `pages/AvatarPage.jsx`, `styles/pages/avatar-modeling.css`, and the already-unreferenced `styles/pages/avatar.css`; drop the `avatar` route from `appPages.jsx`, `useRouter`, `navigation.js` (and the now-unused `Smile` icon), the `avatar-fullscreen-content` class in `AppLayout`, and the `.content:has(.avatar-studio)` rule in `layout-symmetry.css`.
- **Dead variants:** remove `--avatar-studio-accent` (tokens.css/dark.css), the `chrome` prop and `.eve-avatar--bare` rules (no caller passed `chrome={false}`), and the Avatar Studio auto-collapse effect in `EveGlobalCompanion`.
- **Editor-context channel:** remove `editor_context` from `EveChatRequest`, `chat_with_eve`, `stream_chat_with_eve`, `resolve_chat_context`, both Eve routes, `eveApi.sendEveMessage`/`streamEveMessage`, `EveAssistantModal`, and the `stride:avatar-editor-context` listener in `Header`.
- **Backend:** delete `routes/modeling.py`, `schemas/modeling.py`, `services/modeling_projects.py`, `repositories/modeling_projects.py`, `tests/unit/test_modeling_projects.py`, the router include, `Settings.modeling_asset_max_bytes`, the Eve `avatar_editor_action` tool + handler + dispatcher entry + prompt entry, and the "Avatar Studio open" instruction block in `chat_context`.
- **Kept:** Eve Avatar (VRM/Live2D companion, `/eve/avatar/*`, `EveAvatarSection`, `/app/avatar-overlay`) — a separate feature that never depended on the Studio.

## Consequences

- **Positive:** ~2,500 lines of page/editor code and a whole API surface removed; the Eve chat contract loses a browser-specific field; no dead editor events, tools, or tokens remain; the sidebar's Evolve group no longer advertises a missing page.
- **Negative / Cost:** the 3D modeling capability (scene schema, GLB/GLTF/VRM/OBJ/FBX import, timeline, texture paint, GLB export) is gone from the product; previously saved modeling projects stay on disk under `workspaces/<user>/.modeling/` but are unreachable; `MODELING_ASSET_MAX_BYTES` is no longer read (an env var left set is simply ignored).
- **Follow-up:** if modeling returns, restore it from git history (`git log --diff-filter=D -- website/src/pages/avatar-studio`) and re-add the API as a new ADR; do not resurrect the `editor_context` field without a caller.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Frontend page only, keep the API | Leaves `/modeling/projects` + repository + tests with no caller — dead code by §2.3 |
| Keep the Eve `avatar_editor_action` tool warm | Prompt/tool honouring an editor that cannot exist misleads the model and keeps the frontend event dead |
| Keep `editor_context` as a generic context channel | Its only producer was the Studio; a generic field with no caller is speculative (YAGNI) |
| Also remove the Eve Avatar companion | Different feature (remote Live2D/VRM + overlay window); outside this request |

## References

- Removed: `website/src/pages/avatar-studio/`, `website/src/pages/AvatarPage.jsx`, `server/app/api/routes/modeling.py`, `server/app/repositories/modeling_projects.py`
- Kept: `website/src/components/eve/avatar/`, `server/app/api/routes/eve_avatar.py`, `website/src/pages/AvatarOverlayPage.jsx`
- Recovery: `git log --diff-filter=D --name-only -- website/src/pages/avatar-studio`