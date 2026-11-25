# ADR 0075 — Editorial Broadsheet Landing Page Redesign

## Status

Accepted

- Date: 2026-11-25
- Deciders: user ("Do a Full Redesign of Landing page", Editorial Broadsheet, White + Dark modes per ADR 0057)
- Tags: `frontend`, `landing`, `design-system`, `typography`
- Supersedes: [ADR 0020](./0020-landing-cinematic-module-theming.md), [ADR 0024](./0024-landing-bold-experimental-redesign.md)

## Context

The public landing page (`website/src/pages/landing/`) used the `.cinema` scope, which pinned a dark-only monochrome palette, mountain-ridge SVG scenery, 3D mouse-tilt, blur-in text reveals, and an 8-section cadence. While ADR 0057 neutralized its hues to monochrome, `.cinema` remained isolated from the app's White and Dark theme tokens (`styles/themes/index.css`, `dark.css`) and carried visual motifs (3D tilt, floating glass pills, mountain scenery) that no longer matched Stride's monochrome Swiss-grid product identity.

## Decision

- **Theme-aware White + Dark Broadsheet:** Replace `.cinema` with `.broadsheet`, consuming live theme tokens (`--bg-primary`, `--bg-secondary`, `--text-primary`, `--border-color`, `--color-primary`, `--on-fill`) so the landing page renders natively in both White and Dark modes. Add a masthead theme toggle in `Nav.jsx` synced to `THEME_MODE_KEY` (`stride.theme` in `lib/storageKeys.js`).
- **Typography:** Load `JetBrains Mono` alongside `Inter` in `website/index.html` and expose `--font-mono` in `website/src/styles/tokens.css` for numbered indices, tabular timestamps, and Eve tool-loop traces.
- **Streamlined 6-section architecture:**
  1. `Nav` — sticky ruled masthead with theme toggle, scroll progress hairline, and `/login` + `/signup` CTAs.
  2. `Hero` — asymmetric Swiss grid with live OS Workbench vignette.
  3. `ProductFolio` — merges Manifesto + Showcase into a 4-surface interactive folio (`Dashboard`, `Code Workspace`, `Calendar`, `Eve AI`) with `layoutId` tab indicator.
  4. `Eve` — interactive tool-loop trace + transcript + 3-row capability ledger.
  5. `SystemIndex` — 8-module ruled grid + 3-step onboarding strip.
  6. `FAQ` + `Finale` + `Footer` — two-column ruled FAQ, closing CTA band, and 3-column colophon footer.
- **Crisp mechanical motion:** Keep `MotionConfig` + `useReducedMotion`, using snappy transitions and hairline progress without 3D tilt or blur-in reveals.

## Consequences

- **Positive:** Landing page now shares the exact White + Dark monochrome token system with the rest of Stride, supports instant White/Dark switching for visitors, and removes ~1,000 lines of scoped `.cinema-*` overrides.
- **Negative / Cost:** Visitors on the landing page no longer see the atmospheric mountain scenery; visual authority relies on grid alignment, hairline borders, and typography.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep `.cinema` dark-only pin with updated copy | Violates user decision for White + Dark monochrome broadsheet |
| Add editorial serif display font | `Inter` + `JetBrains Mono` keeps the technical workspace identity unified |

## References

- `website/src/pages/landing/LandingPage.jsx`
- `website/src/pages/landing/broadsheet-base.css`, `broadsheet-hero.css`, `broadsheet-sections.css`
- `website/index.html`, `website/src/styles/tokens.css`
