"""WhatsApp service facade — preserves the public WhatsAppService API."""

from app.services.whatsapp import eve_ai, messaging, session


class WhatsAppService:
    get_status = staticmethod(session.get_status)
    initiate_pairing = staticmethod(session.initiate_pairing)
    confirm_connection = staticmethod(session.confirm_connection)
    _ensure_eve_chat = staticmethod(session.ensure_eve_chat)
    disconnect = staticmethod(session.disconnect)
    _sync_worker_chats_background = staticmethod(session.sync_worker_chats_background)
    list_chats = staticmethod(messaging.list_chats)
    get_messages = staticmethod(messaging.get_messages)
    send_message = staticmethod(messaging.send_message)
    _handle_eve_response = staticmethod(eve_ai.handle_eve_response)
    generate_draft = staticmethod(eve_ai.generate_draft)
    summarize_chat = staticmethod(eve_ai.summarize_chat)
    chat_about_summary = staticmethod(eve_ai.chat_about_summary)


__all__ = ["WhatsAppService"]
