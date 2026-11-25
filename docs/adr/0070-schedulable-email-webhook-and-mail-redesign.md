# 0070: Schedulable Email Webhook and Mail Redesign

- **Status:** Accepted
- **Date:** 2026-11-25

## Context

Previously, Stride's Mail integration relied on full Gmail OAuth (`gmail.readonly`, `gmail.send`, `gmail.modify`) with an embedded inbox, category tabs, composer, and Eve email tools. Maintaining full-mailbox OAuth scopes and a full email client added unnecessary surface area when the primary goal is turning incoming schedulable emails from Google Workspace Studio into actionable Calendar, Todo, and Eve Scheduler items.

## Decision

1. **Add `POST /api/webhooks/schedulable-email`**:
   - Mounted directly on the FastAPI app in `server/app/main.py` via `server/app/api/routes/webhooks.py` so it resolves at the exact `/api/webhooks/schedulable-email` path (proxied by both Nginx and Vercel `/api/*` rules).
   - Validates `sender`, `subject`, and `body` as required non-empty strings, returning `400 Bad Request` via `app.core.errors.bad_request` on missing/invalid fields or malformed JSON.
   - Supports optional `X-Webhook-Secret` header verification when `WEBHOOK_SECRET` is configured.
   - Logs incoming payloads cleanly and calls `processSchedulableEmail(payload)` in `server/app/services/schedulable_email.py`.
   - Persists incoming payloads to the `schedulable_emails` table (`server/app/models/schedulable_email.py`, `server/app/repositories/schedulable_emails.py`), scoped to `DEFAULT_WEBHOOK_USER_ID` or matched recipient/first user.

2. **Redesign Mail to Mail Scheduler & Remove Gmail OAuth**:
   - Removed `server/app/api/routes/gmail.py`, `server/app/services/gmail_messages.py`, Eve's `EMAIL_TOOLS` / `handlers/email.py`, and frontend `gmailApi.js` / `googleMail.js` / inbox-composer components.
   - Added `/api/v1/schedulable-mail` endpoints (`server/app/api/routes/schedulable_mail.py`) to list incoming emails and schedule them as a dated `Todo` (including `target="calendar"` so it surfaces on `CalendarPage`) or an `EveSchedule`.
   - Redesigned `website/src/pages/MailsPage.jsx` and `website/src/pages/settings/GmailSection.jsx` into the Mail Scheduler queue and Webhook settings card.

## Consequences

- **Positive:** Eliminates Gmail OAuth token management, inbox polling, and broad Gmail scopes; unifies email-driven scheduling with existing `Todo` and `EveSchedule` systems.
- **Negative:** Users can no longer read/compose arbitrary Gmail threads inside Stride; existing Gmail OAuth connections are removed.

## Alternatives Considered

- **Keep Gmail OAuth alongside the webhook:** Rejected to avoid maintaining dual mail architectures and broad OAuth scopes.
- **Mount webhook under `/api/v1/webhooks`:** Rejected because the external Google Workspace Studio contract targets `/api/webhooks/schedulable-email`.
