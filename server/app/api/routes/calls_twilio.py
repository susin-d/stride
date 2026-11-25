"""Twilio PSTN routes — dual call option (in_app WebRTC vs Twilio PSTN).

All new calls use ConversationRelay via /twilio/relay-twiml/{call_id}.
The old gather-based flow (twiml/{call_id}, gather, gather-fast) was removed
in ADR 0072 — superseded by the relay WebSocket path.
"""

import asyncio
import logging
from fastapi import APIRouter, Depends, Request
from fastapi.responses import PlainTextResponse

from app.core.auth import get_current_user
from app.core.errors import bad_gateway, service_unavailable
from app.core.config import settings
from app.db import SERVER_TIMESTAMP, SqlClient, get_firestore
from app.repositories.calls import CallRepository
from app.repositories.users import get_user_by_id
from app.schemas.call import CallResponse, CallUser, EveTwilioCallRequest, TwilioCallCreate
from app.services.notifications import send_call_notification
from app.services.prompts import (
    DEFAULT_CALL_GREETING,
)
from app.services.twilio.client import TwilioError, initiate_twilio_call, is_twilio_configured, map_twilio_status
from app.services.twilio.twiml import build_relay_twiml

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calls")


def _twilio_base() -> str:
    base = (settings.twilio_callback_base_url or "").rstrip("/")
    if not base:
        base = f"http://127.0.0.1:8000"
    return base


def _relay_ws_url(call_id: str) -> str:
    """wss relay URL for ConversationRelay (https→wss, http→ws)."""
    from app.api.routes.twilio_relay import relay_ws_url_for_call

    return relay_ws_url_for_call(call_id)


@router.get("/twilio/config")
def twilio_config(user: dict = Depends(get_current_user)):
    return {
        "enabled": is_twilio_configured(),
        "from_number": settings.twilio_phone_number if is_twilio_configured() else None,
        "configured": is_twilio_configured(),
    }


@router.post("/twilio", response_model=CallResponse)
async def create_twilio_call(payload: TwilioCallCreate, database: SqlClient = Depends(get_firestore), user: dict = Depends(get_current_user)):
    if not is_twilio_configured():
        raise service_unavailable("Twilio PSTN calling is not configured on the server. Set TWILIO_* env vars.")
    repo = CallRepository(database)
    # Create internal call record with provider=twilio
    caller = CallUser(uid=user["uid"], name=user.get("name") or user.get("display_name") or "", email=user.get("email") or "")
    # For PSTN, callee is synthetic phone identity
    callee = CallUser(uid=f"phone:{payload.phone_number}", name=payload.phone_number, email="")
    call = repo.create(caller=caller, callee=callee, mode=payload.mode, provider="twilio", phone_number=payload.phone_number)
    # ConversationRelay: Twilio opens /ws/twilio-relay?call_id=... and we stream text tokens
    twiml_url = f"{_twilio_base()}/api/v1/calls/twilio/relay-twiml/{call['id']}"
    status_cb = f"{_twilio_base()}/api/v1/calls/twilio/status"
    # Store message as first Say text if provided
    if payload.message:
        call["messages"] = [{"id": "twilio-say", "from_uid": user["uid"], "type": "say", "payload": payload.message[:500], "created_at": call["created_at"]}]
    try:
        tw = initiate_twilio_call(payload.phone_number, twiml_url, status_cb)
        sid = tw.get("sid") or tw.get("sid", "")
        if sid:
            repo.set_external_sid(call["id"], sid)
            call["external_sid"] = sid
    except TwilioError as e:
        logger.error(f"Twilio initiate failed for {payload.phone_number}: {e}")
        # mark call as missed/failed but still return record for UI
        repo.update_status(call["id"], "missed")
        call["status"] = "missed"
        raise bad_gateway(str(e)) from e
    send_call_notification(database=database, target_user_id=user["uid"], title="Twilio Call Initiated", message=f"Calling {payload.phone_number} via Twilio", notification_type="call_incoming", call_id=call["id"])
    return call


@router.post("/trigger-eve-twilio", response_model=CallResponse)
async def trigger_eve_twilio_call(payload: EveTwilioCallRequest, database: SqlClient = Depends(get_firestore), user: dict = Depends(get_current_user)):
    if not is_twilio_configured():
        raise service_unavailable("Twilio not configured.")
    repo = CallRepository(database)
    user_rec = get_user_by_id(database, user["uid"]) or user
    callee = CallUser(uid=user["uid"], name=user_rec.get("display_name") or user_rec.get("name") or "User", email=user_rec.get("email") or "")
    eve = CallUser(uid="eve-bot", name="Eve AI Assistant", email="eve@stride.app")
    call = repo.create(caller=eve, callee=callee, mode=payload.mode, provider="twilio", phone_number=payload.phone_number)
    # prompt stored as Say text
    prompt = payload.prompt or DEFAULT_CALL_GREETING
    # Update call with say payload so twiml can render it
    try:
        repo.append_message(call["id"], {"id": "eve-prompt", "from_uid": "eve-bot", "type": "say", "payload": prompt[:500], "created_at": call["created_at"]})
        call["messages"] = [{"id": "eve-prompt", "from_uid": "eve-bot", "type": "say", "payload": prompt[:500], "created_at": call["created_at"]}]
    except Exception:
        pass
    twiml_url = f"{_twilio_base()}/api/v1/calls/twilio/relay-twiml/{call['id']}"
    status_cb = f"{_twilio_base()}/api/v1/calls/twilio/status"
    try:
        tw = initiate_twilio_call(payload.phone_number, twiml_url, status_cb)
        sid = tw.get("sid") or ""
        if sid:
            repo.set_external_sid(call["id"], sid)
            call["external_sid"] = sid
    except TwilioError as e:
        logger.error(f"Eve Twilio failed for {payload.phone_number}: {e}")
        repo.update_status(call["id"], "missed")
        raise bad_gateway(str(e)) from e
    send_call_notification(database=database, target_user_id=user["uid"], title="Incoming Eve Call (Twilio)", message=f"Eve is calling your phone {payload.phone_number}", notification_type="call_incoming", call_id=call["id"])
    return call


@router.get("/twilio/relay-twiml/{call_id}", response_class=PlainTextResponse)
async def twilio_relay_twiml(call_id: str):
    """ConversationRelay TwiML — Twilio opens our WebSocket and streams JSON.

    The greeting is spoken on answer; subsequent turns stream over
    /ws/twilio-relay with barge-in support."""
    # Greeting comes from the call record when present (Eve prompt / say text).
    greeting = None
    try:
        call = CallRepository(get_firestore()).get(call_id)
        for message in (call or {}).get("messages") or []:
            if message.get("type") == "say":
                greeting = message.get("payload")
                break
    except Exception as error:
        logger.warning(f"relay-twiml lookup failed for {call_id}: {error}")
    twiml = build_relay_twiml(_relay_ws_url(call_id), greeting=greeting)
    return PlainTextResponse(twiml, media_type="application/xml")


@router.post("/twilio/status", response_class=PlainTextResponse)
async def twilio_status_callback(request: Request, database: SqlClient = Depends(get_firestore)):
    from app.services.twilio.verify import verify_twilio_request
    await verify_twilio_request(request)
    form = await request.form()
    # Twilio sends as form-encoded
    sid = form.get("CallSid") or form.get("Sid") or ""
    status = form.get("CallStatus") or form.get("Status") or ""
    # also handle JSON if Twilio configured differently
    if not sid:
        try:
            body = await request.json()
            sid = body.get("CallSid") or body.get("sid") or sid
            status = body.get("CallStatus") or body.get("status") or status
        except Exception:
            pass
    if sid and status:
        internal = map_twilio_status(status)
        # Find call by external_sid
        try:
            # Use streaming query to find matching call
            found = None
            try:
                q = database.collection("calls").where("external_sid", "==", sid).limit(1).stream()
                for doc in q:
                    found = doc.id
                    break
            except Exception:
                # fallback brute force scan of recent calls (e2-micro bounded)
                pass
            if found:
                repo = CallRepository(database)
                repo.update_status(found, internal)
                # push WS to participants
                call = repo.get(found)
                if call:
                    from app.core.ws_manager import call_ws_manager
                    for uid in set([call.get("caller", {}).get("uid"), call.get("callee", {}).get("uid")] ) - {None}:
                        await call_ws_manager.send(uid, {"type": "call_updated", "call": call})
        except Exception as e:
            logger.warning(f"Twilio status update failed sid={sid} status={status}: {e}")
    return PlainTextResponse('<?xml version="1.0"?><Response/>', media_type="application/xml")

