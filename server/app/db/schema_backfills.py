"""Idempotent SQLite/PostgreSQL schema backfills and performance indexes."""

from __future__ import annotations

from sqlalchemy import Engine, text

_PERFORMANCE_INDEX_STATEMENTS = (
    "CREATE INDEX IF NOT EXISTS ix_jobs_user_deleted_created ON jobs(user_id, deleted, created_at DESC, id DESC)",
    "CREATE INDEX IF NOT EXISTS ix_projects_user_deleted_created ON projects(user_id, deleted, created_at DESC, id DESC)",
    "CREATE INDEX IF NOT EXISTS ix_hackathons_user_deleted_created ON hackathons(user_id, deleted, created_at DESC, id DESC)",
    "CREATE INDEX IF NOT EXISTS ix_documents_user_deleted_updated ON documents(user_id, deleted, updated_at DESC, id DESC)",
    "CREATE INDEX IF NOT EXISTS ix_todos_user_deleted_due ON todos(user_id, deleted, due_date, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS ix_contacts_user_deleted_name ON contacts(user_id, deleted, name)",
    "CREATE INDEX IF NOT EXISTS ix_notifications_user_read_created ON notifications(user_id, read, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS ix_calls_status_updated ON calls(status, updated_at) WHERE status='ringing'",
    "CREATE INDEX IF NOT EXISTS ix_whatsapp_messages_user_chat_ts ON whatsapp_messages(user_id, chat_id, timestamp DESC)",
    "CREATE INDEX IF NOT EXISTS ix_calls_participants_created ON calls(caller_id, receiver_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS ix_user_sessions_user_created ON user_sessions(user_id, created_at DESC, id DESC)",
    "CREATE INDEX IF NOT EXISTS ix_user_sessions_user_last_seen ON user_sessions(user_id, last_seen_at DESC)",
    "CREATE INDEX IF NOT EXISTS ix_user_sessions_jti ON user_sessions(token_jti)",
    "CREATE INDEX IF NOT EXISTS ix_user_sessions_user_device ON user_sessions(user_id, device_id)",
)


def _add_missing_columns(
    sync_engine: Engine,
    is_sqlite: bool,
    table: str,
    columns: list[tuple[str, str, str | None]],
    *,
    require_table: bool = False,
) -> None:
    """Idempotently add columns to ``table``.

    Each entry in ``columns`` is ``(column_name, sqlite_type, pg_type_override)``.
    When ``pg_type_override`` is ``None``, ``sqlite_type`` is used for both dialects.
    """
    with sync_engine.connect() as conn:
        if is_sqlite:
            existing = {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))}
            if require_table and not existing:
                return
            for col_name, sqlite_def, _ in columns:
                if col_name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {sqlite_def}"))
        else:
            for col_name, sqlite_def, pg_def in columns:
                col_def = pg_def or sqlite_def
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col_name} {col_def}"))
        conn.commit()


def _ensure_call_columns(sync_engine: Engine, is_sqlite: bool) -> None:
    _add_missing_columns(
        sync_engine,
        is_sqlite,
        "calls",
        [
            ("messages", "JSON NOT NULL DEFAULT '[]'", None),
            ("provider", "TEXT DEFAULT 'in_app'", "VARCHAR(32) DEFAULT 'in_app'"),
            ("external_sid", "TEXT", "VARCHAR(64)"),
            ("phone_number", "TEXT", "VARCHAR(32)"),
        ],
    )
    if is_sqlite:
        with sync_engine.connect() as conn:
            conn.execute(text("UPDATE calls SET provider='in_app' WHERE provider IS NULL"))
            conn.commit()


def _ensure_whatsapp_columns(sync_engine: Engine, is_sqlite: bool) -> None:
    _add_missing_columns(
        sync_engine,
        is_sqlite,
        "whatsapp_messages",
        [
            ("sender_avatar_url", "TEXT", None),
            ("reactions", "JSON DEFAULT '[]'", None),
            ("is_forwarded", "BOOLEAN DEFAULT FALSE", None),
            ("is_starred", "BOOLEAN DEFAULT FALSE", None),
            ("is_pinned", "BOOLEAN DEFAULT FALSE", None),
        ],
    )
    _add_missing_columns(
        sync_engine,
        is_sqlite,
        "whatsapp_chats",
        [
            ("avatar_url", "TEXT", None),
            ("participants", "JSON DEFAULT '[]'", None),
            ("unread_count", "INTEGER DEFAULT 0", None),
            ("last_message", "JSON", None),
            ("is_pinned", "BOOLEAN DEFAULT FALSE", None),
            ("is_muted", "BOOLEAN DEFAULT FALSE", None),
            ("is_archived", "BOOLEAN DEFAULT FALSE", None),
            ("eve_auto_reply", "BOOLEAN DEFAULT FALSE", None),
        ],
    )


def _ensure_eve_memory_embedding(sync_engine: Engine, is_sqlite: bool) -> None:
    """Enable pgvector and add embedding column + HNSW index (Postgres only)."""
    if is_sqlite:
        with sync_engine.connect() as conn:
            cols = {row[1] for row in conn.execute(text("PRAGMA table_info(eve_memories)"))}
            if "embedding" not in cols:
                for col_type in ("JSON", "TEXT"):
                    try:
                        conn.execute(text(f"ALTER TABLE eve_memories ADD COLUMN embedding {col_type}"))
                        break
                    except Exception:
                        continue
            conn.commit()
        return

    with sync_engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        except Exception:
            pass
        conn.execute(text("ALTER TABLE eve_memories ADD COLUMN IF NOT EXISTS embedding vector(1536)"))
        for idx_sql in (
            "CREATE INDEX IF NOT EXISTS ix_eve_memories_embedding ON eve_memories USING hnsw (embedding vector_cosine_ops)",
            "CREATE INDEX IF NOT EXISTS ix_eve_memories_embedding ON eve_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)",
        ):
            try:
                conn.execute(text(idx_sql))
                break
            except Exception:
                continue
        conn.commit()


def _ensure_performance_indexes(sync_engine: Engine, is_sqlite: bool) -> None:
    with sync_engine.connect() as conn:
        for stmt in _PERFORMANCE_INDEX_STATEMENTS:
            if is_sqlite:
                try:
                    conn.execute(text(stmt))
                except Exception:
                    pass
            else:
                conn.execute(text(stmt))
        conn.commit()


def run_schema_backfills(sync_engine: Engine, is_sqlite: bool) -> None:
    """Run all idempotent column backfills and index creations."""
    _ensure_call_columns(sync_engine, is_sqlite)
    _ensure_whatsapp_columns(sync_engine, is_sqlite)
    _ensure_eve_memory_embedding(sync_engine, is_sqlite)
    _add_missing_columns(
        sync_engine,
        is_sqlite,
        "documents",
        [
            ("url", "TEXT", None),
            ("doc_type", "VARCHAR(80) DEFAULT 'FILE'", None),
            ("size_label", "VARCHAR(80) DEFAULT 'Unknown'", None),
            ("drive_file_id", "VARCHAR(255)", None),
        ],
        require_table=True,
    )
    _add_missing_columns(
        sync_engine,
        is_sqlite,
        "hackathons",
        [
            ("starts_at", "TIMESTAMP WITH TIME ZONE", None),
            ("ends_at", "TIMESTAMP WITH TIME ZONE", None),
            ("mode", "VARCHAR(64)", None),
            ("team_size", "VARCHAR(32)", None),
            ("tags", "JSON DEFAULT '[]'", None),
        ],
        require_table=True,
    )
    _add_missing_columns(
        sync_engine,
        is_sqlite,
        "notifications",
        [("notification_time", "VARCHAR(32)", None)],
        require_table=True,
    )
    _add_missing_columns(
        sync_engine,
        is_sqlite,
        "eve_schedules",
        [
            ("title", "VARCHAR(255)", None),
            ("schedule_type", "VARCHAR(32)", None),
            ("execute_at", "TIMESTAMP WITH TIME ZONE", None),
            ("next_run_at", "TIMESTAMP WITH TIME ZONE", None),
        ],
        require_table=True,
    )
    _add_missing_columns(
        sync_engine,
        is_sqlite,
        "user_sessions",
        [
            ("device_id", "VARCHAR(64)", None),
            ("device_name", "VARCHAR(255)", None),
            ("user_agent", "TEXT", None),
            ("ip_address", "VARCHAR(64)", None),
            ("token_jti", "VARCHAR(64)", None),
            ("expires_at", "TIMESTAMP WITH TIME ZONE", None),
            ("revoked", "BOOLEAN DEFAULT FALSE", None),
            ("revoked_at", "TIMESTAMP WITH TIME ZONE", None),
            ("last_seen_at", "TIMESTAMP WITH TIME ZONE", None),
        ],
        require_table=True,
    )
    _ensure_performance_indexes(sync_engine, is_sqlite)
