# ADR 0064 — Hard `@eve`-only gate for Eve WhatsApp replies

## Status

Accepted

- Date: 2026-11-24
- Deciders: @susindran
- Tags: `whatsapp`, `eve`, `ai-safety`, `trigger`

## Context

Eve could auto-send WhatsApp messages based on a loose, multi-branch heuristic. Both trigger sites duplicated their own matching logic:

- `routes/whatsapp/_shared.py:has_eve_mention` — substring match on `eve_tag`, the literal `"@eve"`, **owner aliases** (`@susindran`, `@susin`), and a **keyword list** that shipped with `eve`, `urgent`, `help`, `summary`, `schedule`, plus `startswith("eve ")` and `== "eve"`.
- `services/whatsapp.py:send_message` — a third inline copy of the same branches, plus `chat_id == "eve"`.

Because matching was plain substring (`kw in text_lower`), an ordinary message like *"urgent, call me"* or *"the summary is ready"* made Eve reply to a real contact — sending an AI-generated message **as the user** to an external person. `@evelyn` also matched. SQL `LIKE`-style substring semantics on a live messaging rail is an unacceptable blast radius: a single false trigger leaks an outbound message to a third party.

## Decision

Adopt one canonical gate — `server/app/services/whatsapp_trigger.py` — and make `@eve` the **only** consent signal for a real WhatsApp chat.

- **Hard rule:** `should_eve_reply(chat_id, content, user_settings, sender_id=, sender_name=, is_from_me=)` returns `True` only when the text carries an explicit Eve mention token.
- **Token matching:** case-insensitive `@eve` bounded by `(?<![a-z0-9_])` / `(?![a-z0-9_])`, so `@evelyn` and `@everyone` never match. A custom `eve_tag` is matched the same way.
- **Removed consent signals:** keywords, owner aliases, bare `eve`, `startswith("eve ")`. They stay in `WhatsAppSettings` for compatibility but can no longer authorize a reply.
- **Exceptions, both bounded:** the dedicated in-app chat `chat_id == "eve"` still answers — but only incoming messages (`is_from_me` is `False`), never its own output (`sender_id == "eve"` / name starting with `Eve`).
- **Single call site per rail:** `routes/whatsapp/webhook.py` (inbound worker events) and `services/whatsapp.py:send_message` (in-app send) both call the gate. `has_eve_mention` was deleted, so a second heuristic cannot be reintroduced by reuse.
- **Loop guard:** Eve's own replies are never treated as triggers, preventing reply storms in groups.

## Consequences

- **Positive:** Eve can no longer message a contact or group without an explicit `@eve`. The rule lives in one function with unit tests, so the two rails cannot drift.
- **Negative / Cost:** Users who relied on `urgent` / `help` keywords as implicit triggers now get silence until they type `@eve`. Settings UI still lists keyword chips — they are now inert and should be re-labelled or removed in a follow-up.
- **Follow-up:** Audit `services/eve/handlers/whatsapp.py:handle_send_whatsapp_message` (the Eve agent tool) — it currently writes to the DB without forwarding to the worker, so it is not gated by this ADR.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep keywords, just add `\b` boundaries | Bounded keywords still let *Urgent!* trigger an outbound AI message as the user. |
| One boolean setting to "require mention" | A configurable safety rail is a rail that silently gets disabled; the limit must be structural. |
| Gate inside `_handle_eve_response` | It also serves legitimate `eve`-chat traffic and drafts; the decision belongs at the trigger, not the handler. |
| Do nothing | Realistic messages were already producing unrequested outbound replies. |

## References

- `server/app/services/whatsapp_trigger.py`
- `server/app/api/routes/whatsapp/webhook.py:133`
- `server/app/services/whatsapp.py:400`
- `server/tests/unit/test_whatsapp_trigger.py`, `server/tests/api/test_whatsapp_webhook_routes.py`
