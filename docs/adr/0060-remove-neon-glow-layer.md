# ADR 0060 — Remove the neon glow layer

## Status

Accepted (amended 2026-11-24 — second pass removed the remaining washes, soft halos and specular sweep)

- Date: 2026-11-24
- Deciders: user ("remove neon design from ui", then "remove all glow effect")
- Tags: `frontend`, `design-system`, `tokens`
- Follows [ADR 0057](./0057-monochrome-white-and-dark-modes.md) (the hue retirement; this removes the luminance half)

## Context

ADR 0057 made the palette monochrome but deliberately kept the *light emission* layer: an `--glow-*` token family (six roles × light/dark), `--cinema-glow-primary` for the landing scope, ambient radial "bloom" elements, and halo `box-shadow`s (zero-offset blur) on buttons, status dots, steps and frames. With hue gone, those halos were the last "neon" signal in the UI — glowing dots, luminous button edges, blurred light blobs behind the landing hero, Studio hero and wave loader — and the user asked for the neon design to be removed.

The glow layer was also unenforced: nothing prevented new code from adding another halo, and two elements (`.cinema-finale__glow`, the WaveLoader pair) carried markup for effects that were already invisible or purely decorative.

## Decision

Remove light emission as a design primitive; keep depth and surface.

- **Tokens:** delete the six `--glow-*` tokens in `styles/tokens.css` (both modes), the `--glow-primary` pin in `auth-split.css`, and `--cinema-glow-primary` in the landing scope. Nothing may reintroduce a `--glow-*` name.
- **Consumers get honest substitutes:** primary buttons use `var(--shadow-sm)` (elevation, not light); `Eve` call orb keeps its elevation shadow and state cues switch to solid rings (`0 0 0 Npx`) — speaking keeps its scale pulse, thinking gets a `--color-accent-light` ring, the live status dot keeps its 2px ring.
- **Ambient blooms deleted:** `.cinema-hero__glow` (×2) and `.cinema-hero__orb`, `.cinema-stage__glow`, `.cinema-finale__glow`, `.studio-hero-glow` + both blurred `.studio-hero-gradient` discs (with their `@keyframes` and reduced-motion refs), and both `.wave-loader-glow` washes — markup, rules and animations together.
- **Halos deleted:** landing scene-label dot, live-wave dot, active step card and the `.cinema-frame` bleed, plus the WhatsApp jump highlight (its `drop-shadow` flash becomes a `box-shadow: 0 0 0 2px` ring flash; keyframe renamed `highlightGlow` → `highlightFlash`).
- **Kept, deliberately:** solid `0 0 0 Npx` focus/active rings, the shadow/elevation scale, glass `backdrop-filter` blur, linear fills and scrims, the hero grid pattern, and the landing SVG scenery — those are surface texture, not light emission.

### Second pass — remove *all* glow (same day)

The user asked again for "all glow effect", so the surface-level light that the first pass had spared was removed too:

- **Accent light washes deleted:** the auth page/form radial washes, the wave-loader backdrop washes, the Studio page wash, the landing hero/`cinema-eve`/`cinema-finale` background washes (now flat `var(--bg-*)`/`var(--cinema-bg)`), the `.cinema-showcase__bg` scene wash (element + rule), the pointer-tracking `.cinema-feat__spot` spotlight (element, rule and its `--spot-x/--spot-y` handler), and the neutral three-stop background mesh on `body::before` (now flat `--bg-primary`).
- **Soft shadows and rings:** every accent-tinted `box-shadow` (`--color-primary`/`--color-accent`/`--color-danger`, `--nav-accent`, `--widget-accent`, `--cinema-eve`) became `--shadow-sm`/`--shadow-md`/`--shadow-surface` on buttons, accent/danger buttons, nav pill, dashboard widgets and icons; metric-card icon shadows dropped entirely; `.studio-prompt-card:focus-within` and `.ws-card.active` lost their translucent accent halos (the latter keeps a solid `--border-heavy` ring).
- **Specular light:** the auth `.auth-split__horizon` beam (element + rule + reduced-motion ref) and the landing nav CTA's moving white `::after` shimmer are gone.

## Consequences

- **Positive:** one less visual language to maintain; buttons/dots/steps communicate with shape, weight and rings instead of bloom; ~90 lines of glow CSS, three keyframes and five decorative elements removed; the design reads as flat monochrome rather than "dark UI with accents".
- **Negative / Cost:** the landing hero, Studio prompt page and auth shell lose their atmospheric depth and sit on flat surfaces (they now rely on type, grid, scenery SVG and the hero photo); the app background is a single flat colour; speaking/thinking states are subtler and depend on motion, so `prefers-reduced-motion` users rely on the ring cues alone; `hero-bg.png` (1 MB) remains as the hero backdrop and is now the loudest remaining visual.
- **Follow-up:** if a state reads as ambiguous without its glow, add a solid ring or icon change rather than restoring a halo; if the hero photo reads as "neon" to the user, delete `.cinema-hero__photo` and its asset.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep glows but make them neutral | Done in ADR 0057 — neutral halos still read as neon, which is what the user objected to |
| Only remove the `--glow-*` tokens, leave blur blobs | Leaves the most visible neon artefacts (landing/Studio/wave-loader blooms) in place |
| Replace every glow with a strong border/elevation | Noisy: rings already exist on interactive elements; per-effect substitutes are calmer |
| Stop after pass one, keep surface washes and soft shadows | The user then asked for *all* glow; washes, tinted halos and the specular sweep were still light emission |
| Also strip the glass `backdrop-filter` blur and dark scrims | Blur is frosting and scrims *reduce* light for legibility; neither emits light, and removing them would break surface hierarchy |

## References

- `website/src/styles/tokens.css`, `website/src/styles/pages/eve-call-stage.css`, `website/src/styles/pages/studio-hero.css`
- `website/src/pages/landing/cinema-{base,hero,sections}.css`, `website/src/pages/landing/sections/{Hero,Finale}.jsx`
- `website/src/components/WaveLoader.jsx`, `website/src/styles/components/wave-loader.css`