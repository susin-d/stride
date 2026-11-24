# ADR 0056 — Rebrand Starwaves to Stride across code and infrastructure

## Status

Accepted

- Date: 2026-11-24
- Deciders: Stride maintainers
- Tags: `branding`, `infra`, `auth`, `storage`, `domains`

## Context

The repository, its git remote (`github.com/susin-d/stride`), and the working
directory were already renamed to Stride, but the product name `Starwaves`
survived in roughly 840 places across 255 tracked files. The drift was not
cosmetic: the old name was baked into identifiers that other systems depend on,
so leaving it in place meant the shipped product, its deployment target and its
native shells disagreed about what the product is called.

The occurrences fell into six groups with very different blast radii:

1. **Display/brand text** — page titles, legal pages, email templates, landing copy.
2. **Product identifiers** — `app_name`, logger names (`starwaves.log`), themed
   log/DB filenames.
3. **Local storage and window-event keys** — `starwaves.theme`,
   `starwaves:session-revoked`, and 50+ others centralised in
   [`storageKeys.js`](../website/src/lib/storageKeys.js).
4. **Infrastructure names** — Docker container/network/service names, the
   Postgres role, database and password, GHCR image names, and the `~/starwaves`
   deploy path used by every VM script.
5. **Native app identity** — Capacitor `appId`/`appName`, the Android package
   directory, the Tauri `productName`/`identifier`, and the OAuth deep-link
   schemes `com.starwaves.app://` / `app.stride.workspace://`.
6. **Production domains** — `starwaves.susindran.in`,
   `api.starwaves.susindran.in`, `starwaves.vercel.app`,
   `build.starwaves.susindran.in`, plus the CORS allowlists, nginx
   `server_name`s, Let's Encrypt cert paths and the Vercel 308 redirect.

A half-renamed brand is worse than either end state: users would see "Stride"
while their browser still wrote `starwaves.*` keys, and a future contributor
would have no way to tell which spelling was authoritative.

## Decision

Rename **every** occurrence of the brand to Stride, including identifiers and
live infrastructure names, with no dual-name compatibility shim.

- **Case-mapped replacement** applied to all tracked files:
  `starwaves` → `stride`, `Starwaves`/`StarWaves` → `Stride`,
  `STARWAVES` → `STRIDE`. 842 occurrences across 255 files; BOM and encoding
  preserved per file.
- **Paths renamed** (via `git mv`, preserving history):
  [`StrideLogo.jsx`](../website/src/components/StrideLogo.jsx),
  [`0006-canonical-domain-stride-susindran-in.md`](0006-canonical-domain-stride-susindran-in.md),
  and `website/android/app/src/main/java/com/stride/app/`.
- **Canonical domains become** `stride.susindran.in` (frontend) and
  `api.stride.susindran.in` (backend); `stride.vercel.app` 308-redirects at the
  edge. This amends [ADR 0006](0006-canonical-domain-stride-susindran-in.md).
- **Native identity becomes** `com.stride.app` (Capacitor/Android) and
  `app.stride.workspace` (Tauri); both OAuth deep-link schemes move with it.
- **Local infrastructure becomes** `stride-postgres`, `stride-network`,
  `stride`/`stride_password` credentials, `stride-backend` image and the
  `~/stride` deploy path.
- **Stored browser keys are hard-renamed** — no read-old-write-new migration.
- Stale `public/*-logo.png` references were corrected to the asset that
  actually exists, [`public/logo.png`](../website/public/logo.png).

## Consequences

- **Positive:** one spelling of the brand everywhere; the repository, shipped
  UI, native shells and deployment all agree.
- **Negative / Cost:** existing users lose locally cached preferences (theme,
  sidebar, dashboard layout) once, and installed native builds must be rebuilt
  with the new package ID — an in-place app upgrade across a package rename is
  not possible.
- **Follow-up (operational, required before the next deploy):** provision DNS
  `A` records and Let's Encrypt certs for `stride.susindran.in` /
  `api.stride.susindran.in`; add the new deep-link schemes to the Google Cloud
  Console authorized redirect URIs; re-register the GitHub OAuth callback; set
  `stride.susindran.in` as the Primary Vercel domain; and recreate the Docker
  Postgres volume (`docker compose down -v`) because `POSTGRES_DB` only applies
  on first initialisation.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep `*.susindran.in` and `com.starwaves.app` unchanged | Leaves the user-visible brand and the OAuth consent screen showing the old name; the drift that prompted the work would persist in the most visible places. |
| Dual-read storage keys (`stride.x` falling back to `starwaves.x`) | Preserves preferences across the rename, but adds permanent legacy branching in `storageKeys.js` for a one-time gain. |
| Registry/slug rename only, keep code identifiers | Cheapest, but guarantees `starwaves` reappears in every new file and doc. |
| Do nothing | The half-renamed state already existed and was actively misleading. |

## References

- [`storageKeys.js`](../website/src/lib/storageKeys.js)
- [`config.py`](../server/app/core/config.py) — `app_name`, CORS defaults, native schemes
- [`tauri.conf.json`](../website/src-tauri/tauri.conf.json), [`capacitor.config.json`](../website/capacitor.config.json)
- [`docker-compose.yml`](../docker-compose.yml), [`vercel.json`](../vercel.json)
- [ADR 0006](0006-canonical-domain-stride-susindran-in.md), [ADR 0008](0008-oauth-deep-link-mobile-auth.md)
