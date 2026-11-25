"""External HTTP webhook endpoints (Google Workspace Studio, etc.)."""

import hmac
import json
import logging

from fastapi import APIRouter, Depends, Request
from pydantic import ValidationError

from app.core.config import settings
from app.core.errors import bad_request, unauthorized
from app.db import SqlClient, get_firestore
from app.schemas.webhook import SchedulableEmailPayload
from app.services.schedulable_email import ingest_schedulable_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def _verify_webhook_secret(request: Request) -> None:
    secret = settings.webhook_secret
    if not secret:
        return
    provided = request.headers.get("x-webhook-secret") or ""
    if not hmac.compare_digest(provided, secret):
        raise unauthorized("Invalid webhook secret.")


@router.post("/schedulable-email")
async def receive_schedulable_email(
    request: Request,
    database: SqlClient = Depends(get_firestore),
):
    """Receive incoming schedulable email payloads from Google Workspace Studio."""
    _verify_webhook_secret(request)

    raw = await request.body()
    try:
        data = json.loads(raw) if raw else {}
    except json.JSONDecodeError:
        raise bad_request("Invalid JSON payload.")

    if not isinstance(data, dict):
        raise bad_request("Request body must be a JSON object.")

    missing = [
        field
        for field in ("sender", "subject", "body")
        if not isinstance(data.get(field), str) or not data.get(field, "").strip()
    ]
    if missing:
        raise bad_request(f"Missing required field(s): {', '.join(missing)}.")

    try:
        payload = SchedulableEmailPayload(**data)
    except ValidationError as exc:
        first_err = exc.errors()[0]
        raise bad_request(f"Invalid payload field '{first_err.get('loc', ['unknown'])[-1]}': {first_err.get('msg')}") from exc

    logger.info(
        "Received schedulable email webhook: sender=%s subject=%r receivedAt=%s isSchedulable=%s body_len=%d",
        payload.sender,
        payload.subject,
        payload.receivedAt,
        payload.isSchedulable,
        len(payload.body),
    )

    ingest_schedulable_email(database, payload)

    return {"status": "received", "schedulable": bool(payload.isSchedulable)}
