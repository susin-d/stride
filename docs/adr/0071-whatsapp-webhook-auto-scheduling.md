# ADR 0071 — WhatsApp Webhook Auto-Scheduling & Notifications

## Status

Accepted

- Date: 2026-11-25
- Deciders: @stride
- Tags: `whatsapp`, `ai`, `webhook`, `scheduling`, `notifications`

## Context

Incoming WhatsApp messages arriving via `POST /api/v1/whatsapp/webhook` often contain actionable deadlines, tasks, job interviews, hackathons, or timed reminders. Previously, these messages were persisted and broadcast to the chat UI, requiring users to manually copy details into Todos, Jobs, Hackathons, or Eve Schedules (which feed the Stride Calendar). Meanwhile, ADR 0064 enforces a hard `@eve`-only gate for *outbound* WhatsApp replies so Eve never messages contacts unprompted.

We need an automatic background ingestion pipeline that extracts schedulable items from incoming WhatsApp messages, creates the corresponding workspace records, and notifies the user in-app without replying to the WhatsApp chat or blocking the Go worker's 5-second webhook timeout.

## Decision

- **Non-blocking background task:** `server/app/api/routes/whatsapp/webhook.py` schedules `asyncio.create_task(process_message_for_scheduling(...))` after persisting the incoming message and returning `200 {"status": "processed"}`.
- **Single-responsibility extraction service:** `server/app/services/whatsapp/auto_schedule.py` checks eligibility (`auto_schedule_enabled`, non-`eve` chat, `not is_from_me`, optional `auto_schedule_include_groups`, min length 8 chars), runs a single bounded LLM call using `whatsapp_schedule_extraction_prompt` in `server/app/services/prompts.py`, and routes validated items (max 3 per message) to canonical repositories (`todos`, `JobRepository`, `hackathons`, `EveScheduleRepository`).
- **Notifications & real-time UI:** When at least one item is created, `_notify_scheduled_items` persists a `whatsapp_scheduled` notification via `NotificationRepository`, invalidates snapshot caches, attempts FCM multicast push, and broadcasts a `workspace_scheduled` event on `/ws/whatsapp`. `website/src/hooks/useWorkspaceData.js` listens for `workspace_scheduled` to update notifications, todos, jobs, and hackathons live.
- **User controls:** `WhatsAppSettings` (`server/app/schemas/whatsapp.py`) and `website/src/pages/settings/WhatsAppSection.jsx` expose `auto_schedule_enabled` (default `true`) and `auto_schedule_include_groups` (default `false`).

## Consequences

- **Positive:** Actionable WhatsApp messages automatically populate Todos, Calendar, Jobs, Hackathons, and Eve Schedules with immediate in-app notifications, without violating ADR 0064's `@eve`-only outbound reply rule.
- **Negative / Cost:** Each eligible incoming DM triggers one bounded LLM call; users can disable this anytime via Settings → WhatsApp.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Synchronous extraction in webhook handler | Risks exceeding the Go worker's 5s HTTP webhook timeout during LLM latency |
| Auto-replying in WhatsApp to confirm | Violates ADR 0064 (`@eve`-only outbound reply gate) |
| Do nothing | Forces manual data entry from WhatsApp messages into Stride |

## References

- `server/app/services/whatsapp/auto_schedule.py`
- `server/app/api/routes/whatsapp/webhook.py`
- `website/src/hooks/useWorkspaceData.js`
