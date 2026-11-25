# ADR 0069 — Void Theme (Reference Palette Sampling)

## Status

Accepted

- Date: 2026-11-25
- Deciders: @agent, @user
- Tags: `theme`, `styles`, `monochrome`, `design-system`

## Context

Stride previously shipped two monochrome themes (ADR 0057): White (`:root`) and Dark (`html.dark-theme`). Users interacting with dark development environments such as Antigravity IDE requested an ultra-low-contrast, obsidian dark theme matching that exact aesthetic:
- Deep obsidian backdrop (`#121212`) seamlessly unified across sidebars, panels, and content canvases.
- Elevated card and bubble tones (`#191919` to `#222222`) with minimal, muted borders (`#282828`).
- High-contrast pure white/off-white interactive action controls (`#ffffff` with `#121212` text/icon inversion).
- Pure neutral monochrome hierarchy without any extraneous colored tints or blue/violet hue accents.

Furthermore, `themeApplicator.js` originally used a binary `dark-theme` boolean toggle (`root.classList.toggle('dark-theme', isDark)`), preventing modular extension to additional discrete themes.

## Decision

1. **Add `void.css`**: Define `html.void-theme` with colors sampled directly from the Antigravity IDE interface. Import it into `website/src/styles/tokens.css`.
2. **Refactor `themeApplicator.js` for N-theme modes**:
   - Introduce `VALID_MODES = ['light', 'dark', 'void']`.
   - Update `resolveMode(modeId)` and `readStoredMode(storage)` to validate across `VALID_MODES` (defaulting to `'dark'`).
   - Update `applyTheme(data)` to remove active theme classes and apply the specific class (`void-theme` or `dark-theme`, or none for `light`).
   - Update `syncThemeColorMeta` to assign `#121212` as the theme-color meta tag in Void mode.
3. **Register in `ThemesPage.jsx`**: Add `Terminal` icon for `void` mode in `MODE_ICONS`.

## Consequences

- **Positive:**
  - Provides a deep, ultra-low-contrast obsidian experience matching IDE workflows.
  - Maintains strict compliance with ADR 0057's monochrome principles (zero unauthorized hue leaks).
  - Eliminates hardcoded binary theme branching in `themeApplicator.js`, opening the engine to clean multi-theme extensions.
- **Negative / Cost:**
  - One additional CSS file (`~4KB`) loaded via `@import` in `tokens.css`.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Accent-tinted Antigravity theme (`#6e8aff` blue-violet) | Explicitly rejected by user in favor of pure reference sampling adhering to Stride's pure monochrome rule (ADR 0057). |
| Overwriting existing `dark.css` | Breaks users preferring the standard higher-contrast `#0a0a0a` / `#161616` Dark theme. |

## References

- `website/src/styles/themes/void.css`
- `website/src/styles/tokens.css`
- `website/src/themes/themeApplicator.js`
- `website/src/pages/ThemesPage.jsx`
- `docs/adr/0057-monochrome-white-and-dark-modes.md`
