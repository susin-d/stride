# ADR 0072 — Remove Dead Twilio Gather/TwiML Routes

**Status:** Accepted  
**Date:** 2026-11-25

## Context

The Twilio PSTN call flow evolved through two generations:

1. **Legacy gather flow** (removed): `GET /calls/twilio/twiml/{call_id}` returned a `<Gather>` TwiML that directed Twilio to post speech results to `POST /calls/twilio/gather` or `POST /calls/twilio/gather-fast`. These endpoints handled STT-then-Eve-chat-then-TwiML-reply cycles.

2. **ConversationRelay flow** (current): Both `create_twilio_call` and `trigger_eve_twilio_call` now hardcode `relay-twiml` as the callback URL, which opens a WebSocket via `/ws/twilio-relay` and streams bidirectional JSON rather than polling HTTP gather endpoints. This provides lower latency and barge-in support.

The three legacy endpoints (`twilio_twiml`, `twilio_gather`, `twilio_gather_fast`) were never reached by any active call creation path after the ConversationRelay migration. `gather-fast` self-referenced in its own TwiML but was never the target of any `<Gather action=...>` from an active call.

## Decision

Delete the three dead route handlers from `calls_twilio.py`:
- `GET /calls/twilio/twiml/{call_id}`
- `POST /calls/twilio/gather`
- `POST /calls/twilio/gather-fast`

Also clean up now-unused imports: `Form`, `build_eve_twiml`, `build_human_twiml`, and the speech-prompt constants `DEFAULT_CALL_GREETING_SHORT`, `EVE_ECHO_FALLBACK`, `EVE_FALLBACK_NO_PROCESS`, `EVE_GOODBYE`, `EVE_GOODBYE_NO_SPEECH`.

The active routes kept: `GET /twilio/config`, `POST /twilio`, `POST /trigger-eve-twilio`, `GET /twilio/relay-twiml/{call_id}`, `POST /twilio/status`.

## Consequences

- **Positive:** ~160 lines of dead code removed; no active Twilio call can reach these routes.
- **Negative:** If a user has an outstanding `twiml`-based call created before the ConversationRelay migration (extremely unlikely in practice), it would no longer receive a gather response. Such calls would already have timed out.
- **Mitigation:** None required; Twilio call records expire and the relay WebSocket handles the full conversation lifecycle.

## Alternatives Considered

- **Keep as deprecated fallback:** Rejected — no active call creation sets these URLs; keeping them adds confusion and dead test surface.
