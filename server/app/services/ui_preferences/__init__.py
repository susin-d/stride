"""UI preferences service facade."""

from app.services.ui_preferences.store import (
    MAX_HISTORY,
    UI_PREFS_DOC,
    clear_all,
    get_ui_preferences,
    load_raw,
    reset_preferences,
    save_css,
    save_tokens,
    save_visibility,
)
from app.services.ui_preferences.validation import (
    ALLOWED_TOKENS,
    ALLOWED_TOKEN_RE,
    CUSTOM_PAGE_RE,
    MAX_CSS_LENGTH,
    is_gray_color as _is_gray_color,
    sanitize_css as _sanitize_css,
    validate_page as _validate_page,
    validate_tokens as _validate_tokens,
)

__all__ = [
    "ALLOWED_TOKENS",
    "ALLOWED_TOKEN_RE",
    "CUSTOM_PAGE_RE",
    "MAX_CSS_LENGTH",
    "MAX_HISTORY",
    "UI_PREFS_DOC",
    "_is_gray_color",
    "_sanitize_css",
    "_validate_page",
    "_validate_tokens",
    "clear_all",
    "get_ui_preferences",
    "load_raw",
    "reset_preferences",
    "save_css",
    "save_tokens",
    "save_visibility",
]
