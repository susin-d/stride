# ADR 0057 — Monochrome design system with only White and Dark modes

## Status

Accepted

- Date: 2026-11-24
- Deciders: user ("remove all theme and add only white and dark mode and monochrome design")
- Tags: `frontend`, `design-system`, `tokens`, `themes`
- Supersedes the palette mandate of [ADR 0011](./0011-spectrum-color-role-system.md), [ADR 0019](./0019-multi-color-redesign-and-module-theming.md), [ADR 0020](./0020-landing-cinematic-module-theming.md), [ADR 0022](./0022-single-source-color-palette.md) (palette content), [ADR 0023](./0023-crimson-noir-default-dark-theme.md), [ADR 0024](./0024-landing-bold-experimental-redesign.md), [ADR 0026](./0026-auth-pinned-landing-theme.md), [ADR 0028](./0028-crimson-noir-default-and-motion.md) (palette half), [ADR 0030](./0030-crimson-primary-light-theme.md), [ADR 0031](./0031-home-sidebar-accent-follows-primary.md)

## Context

Stride shipped 25 color presets (Multi-Color Spectrum + Vibrant Duotone), an in-app per-token color editor, a crimson/indigo module-accent identity per product area, and three pinned hue scopes (landing `cinema`, `auth-cinematic`, Avatar Studio accent). Users asked for the opposite: one white mode, one dark mode, no color themes at all.

The old architecture also made the request expensive: presets duplicated the palettes as `?raw` CSS imports (`themes/presets.js`), the customizer wrote inline `--token` overrides on `:root`, ~750 near-neutral and chromatic literals sat in 160 stylesheets, and a rear-view chain (`presetId → resolveAvatarTint`) existed only to pick a hue.

## Decision

- **Two modes, no presets.** `styles/themes/index.css` (White) and `styles/themes/dark.css` (Dark) are the only theme files; the other 24 preset files, `themes/presets.js`, `PALETTE_GROUPS`, `getPresetsByPalette`, and `styles/pages/themes-customizer.css` are deleted.
- **One engine.** `themes/themeApplicator.js` owns `THEME_MODES`, the geometry/motion option catalogs, `DEFAULT_APPEARANCE`, `applyTheme()` (mode class + geometry + `theme-color` meta read from the live `--bg-primary`), and `resetThemeVariables()`. No palette is duplicated into JS — the CSS files are the single source.
- **Monochrome ladder.** Every hue token holds a neutral tone. Identity comes from tone, fill weight, borders, and iconography: primary `#171717`/`#f5f5f5`, statuses on one ramp (`success #525252`, `warning #5c5c5c`, `danger #0a0a0a`, `purple #404040`; inverted in dark), module accents tone-only, tokens renamed to pure grays, `--on-fill`/`--text-inverse` flipped per mode. Token *names* (`--color-purple`, `--module-whatsapp`) are kept because `server/app/services/ui_preferences.py` allowlists them and 200+ stylesheets consume them.
- **No color editing.** `useThemeCustomizer` persists `{mode, fontFamily, radius, density, elevation, motion}` under the existing `stride.custom_theme` key, and the Themes page is a White/Dark picker plus geometry controls and a live preview. The Eve-driven per-user UI override system (Appearance section, read-only inspector) is untouched.
- **Sweep.** Every chromatic literal in the app was neutralized: landing `cinema` scope, `auth-cinematic` pin, Avatar Studio accent and paint default, WhatsApp/Calls/Eve/Workspace/Settings stylesheets, and the copy that referenced crimson.
- **Verified:** lint 0 errors, build ok, `npm test` 40/40, and a token contrast audit (text ≥4.5:1, statuses 5.2–16.6:1, control borders ≥3:1).

## Consequences

- **Positive:** one visual voice; Themes page is smaller and honest; theme engine loads without the raw-CSS preset catalog; hue-free surfaces make elevation/borders meaningful; palette changes are now two files.
- **Negative / Cost:** wayfinding by color is gone — module/status distinctions rely on tone + icons and are easier to miss; user-chosen color customization is removed; `.cinema`/`.auth-cinematic` still pin their own neutral values, so a future palette change must touch those blocks too (they are neutral ramps now, not hues).
- **Follow-up:** visually confirm dashboard/WhatsApp/landing at 320/768/1440 in both modes; if tone-only statuses prove ambiguous, add glyph or weight differentiation rather than hue.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep presets, add "white"/"dark" entries | User asked to remove all themes; keeping the catalog keeps the CSS duplication and the color editor |
| Monochrome chrome, keep status hues | Explicitly rejected in the scope question — hue would survive in either mode |
| Keep color-token editing in the Themes page | Reintroduces arbitrary hues and contradicts the monochrome palette |
| Rename hue-named tokens (`--color-purple` → neutral) | Breaks the backend allowlist contract and 200+ consumers for no visual gain |
| Delete the Eve per-user UI override system | It is explicit per-user personalization, not a shipped theme |

## References

- `website/src/styles/themes/index.css`, `website/src/styles/themes/dark.css`
- `website/src/themes/themeApplicator.js`, `website/src/hooks/useThemeCustomizer.js`
- `website/src/pages/ThemesPage.jsx`, `website/src/styles/pages/themes-shell.css`
- `website/src/styles/tokens.css`, `website/src/styles/pages/auth-split.css`, `website/src/pages/landing/cinema-base.css`
