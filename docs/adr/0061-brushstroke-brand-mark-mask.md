# ADR 0061 — Brushstroke "S" brand mark: one mascot asset, tinted at render

## Status

Accepted

- Date: 2026-11-24
- Deciders: Stride maintainers
- Tags: `branding`, `frontend`, `assets`, `native`

## Context

The product logo was the red "Stride" wordmark (`public/logo.png`, 1697×927,
80 % transparent). It was drawn as a raster `<img>` in every brand slot — sidebar,
auth, onboarding, legal pages, landing nav and footer — inside `object-fit: cover`
boxes. The wordmark is not square, so those boxes cropped it, and its red ink sat
outside the strictly monochrome palette of ADR 0057.

The product owner supplied a new mark: a black brushstroke "S" on a pure white
sheet (1254×1254). Brand slots render at 16–36 px, so the same artwork has to
serve three jobs with different geometric needs:

1. **UI glyph** (nav, sidebar, auth, footer, onboarding) — should take the theme
   ink so it is black on White-mode surfaces and near-white inside the pinned
   dark scopes (`.cinema`, `.auth-cinematic`), per ADR 0057.
2. **App icon** (favicon, PWA, Apple touch icon, Capacitor, Tauri, Android) —
   needs the sheet as a bright square tile so the black mark stays legible.
3. **Notification icon** — needs `any`-purpose PNG sizes, not an `.ico`.

## Decision

- **One transparent master.** The white sheet is converted to alpha coverage
  (`alpha = (252 − luminance) / 252`), cropped to its ink, and padded to a square.
  The result is `public/logo-mark.png` (512 px, ink `#0a0a0a`, transparent rest).
- **UI glyph = CSS mask.** `components/StrideLogo.jsx` renders a `<span role="img">`
  whose box is painted by `background-color: var(--stride-mark-tv)` and cut by
  `mask-image: url('/logo-mark.png')`. Default ink is `var(--text-primary)`, which
  is `#0a0a0a` in White mode, `#fafafa` in Dark mode and `#fafafa` inside
  `.cinema` — every brand slot therefore follows its surface without per-page
  overrides. `--stride-mark-tv` is a TV (a custom-property custom-property), so
  it resolves where the glyph is used; the native-shell variant sets it to `none`
  and falls back to a plain background image. Styling lives in the new
  `styles/components/brand-mark.css` (imported first in `App.css`).
- **App icon = white tile.** `public/logo.png` is now a 1024 px rounded tile
  (white fill, mark at 80 % of the side); `website/assets/icon.png` is the same
  tile for `@capacitor/assets`; `favicon.ico` (16/32/48), `icons/icon-192.png`,
  `icons/icon-512.png` and an edge-to-edge `icons/maskable-512.png` complete the
  web set, with `apple-touch-icon.png` (180 px) linked from `index.html`.
- **Landing.** `Nav`/`Footer` drop their raster `<img>` for `<StrideLogo>`; the
  `.cinema-nav__mark` box styling (radius, border, `object-fit`) is removed.
- **Native.** Tauri icons regenerate with `tauri icon website/assets/icon.png`
  and Android with `capacitor-assets generate --android`.
- `server/make_ico.py` is deleted: it wrote the raw upload back into
  `public/logo.png`, which is now the derived tile.

## Consequences

- **Positive:** the mark follows both modes and the pinned dark scopes
  automatically; one 36 kB asset replaces a 634 kB wordmark; brand slots no
  longer need size-specific artwork; the tile is legible at 16 px.
- **Negative / Cost:** the mark is silhouette-only — a pure black artwork can
  no longer be reproduced with its original white surroundings in the UI, and
  browsers without `mask-image` support (none supported today) would show solid
  boxes.
- **Follow-up:** if a coloured or photographic mark is ever required, add an
  `img`-based variant instead of changing this mask path.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Render the white-sheet PNG as `<img>` everywhere | Black tile in dark mode/landing, and 30 px boxes show a bright square against dark chrome |
| Keep the sheet, add `filter: invert()` for dark scopes | Inverts on state change and cannot follow `--text-primary` in user themes |
| Two pre-rendered marks (black + white) | Duplicate assets and still wrong on every intermediate surface |
| Crop the sheet to a square icon only | Loses the tile requirement for PWA/maskable launchers |

## References

- `website/src/components/StrideLogo.jsx`
- `website/src/styles/components/brand-mark.css`
- `website/public/logo-mark.png`, `website/public/logo.png`, `website/assets/icon.png`
- ADR 0057 (monochrome palette), ADR 0060 (no glow)
