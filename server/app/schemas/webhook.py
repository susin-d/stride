"""Pydantic schemas for incoming webhooks and schedulable emails."""

from typing import Literal

from pydantic import BaseModel, Field


class SchedulableEmailPayload(BaseModel):
    sender: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)
    receivedAt: str | None = None
    isSchedulable: bool = True
    recipient: str | None = None


class SchedulableEmailResponse(BaseModel):
    id: str
    sender: str
    subject: str
    body: str
    received_at: str | None = None
    is_schedulable: bool = True
    status: Literal["pending", "scheduled", "dismissed"] = "pending"
    scheduled_target: Literal["calendar", "todo", "eve_schedule"] | None = None
    scheduled_ref_id: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class SchedulableEmailUpdate(BaseModel):
    status: Literal["pending", "scheduled", "dismissed"] | None = None
    scheduled_target: Literal["calendar", "todo", "eve_schedule"] | None = None
    scheduled_ref_id: str | None = None


class ScheduleTodoFromEmailRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    due_date: str | None = None
    target: Literal["todo", "calendar"] = "todo"


class ScheduleEveFromEmailRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    prompt: str | None = Field(default=None, min_length=1, max_length=2000)
    schedule_type: Literal["one_time", "recurring"] = "one_time"
    action_type: Literal["chat_prompt", "voice_call"] = "chat_prompt"
    execute_at: str | None = None
    cron_expression: str | None = None
