"""Validation and sanitization helpers for per-user UI preferences."""

import re

from app.services.eve.constants import WORKSPACE_PAGES

MAX_CSS_LENGTH = 5000

ALLOWED_TOKEN_RE = re.compile(r"^--([a-z0-9-]+)$")
ALLOWED_TOKENS = {
    "--bg-primary",
    "--bg-secondary",
    "--bg-tertiary",
    "--bg-card",
    "--bg-card-hover",
    "--bg-hover",
    "--bg-overlay",
    "--text-primary",
    "--text-secondary",
    "--text-muted",
    "--text-inverse",
    "--color-primary",
    "--color-primary-hover",
    "--color-primary-light",
    "--color-accent",
    "--border-color",
    "--border-light",
    "--border-heavy",
    "--border-focus",
    "--scrollbar-track",
    "--scrollbar-thumb",
    "--scrollbar-thumb-hover",
    "--color-success",
    "--color-warning",
    "--color-danger",
    "--color-purple",
    "--radius-xs",
    "--radius-sm",
    "--radius-md",
    "--radius-lg",
    "--radius-xl",
    "--radius-full",
    "--layout-max-width",
    "--layout-gutter",
    "--layout-section-gap",
    "--layout-card-padding",
    "--shadow-sm",
    "--shadow-md",
    "--shadow-lg",
    "--shadow-surface",
    "--shadow-lifted",
    "--shadow-inset",
    "--shadow-focus",
    "--transition-fast",
    "--transition-normal",
    "--transition-slow",
    "--font-family",
}

CUSTOM_PAGE_RE = re.compile(r"^custom:[a-z0-9-]+$")
_GRAYS = re.compile(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")

_BLOCKED_CSS_PATTERNS = [
    re.compile(r"@import", re.I),
    re.compile(r"expression\s*\(", re.I),
    re.compile(r"javascript\s*:", re.I),
    re.compile(r"url\s*\(\s*['\"]?\s*data\s*:", re.I),
    re.compile(r"url\s*\(\s*['\"]?\s*https?:", re.I),
    re.compile(r"behavior\s*:", re.I),
    re.compile(r"-moz-binding", re.I),
]


def sanitize_css(css: str) -> str:
    """Strip blocked patterns; truncate to MAX_CSS_LENGTH."""
    if len(css) > MAX_CSS_LENGTH:
        css = css[:MAX_CSS_LENGTH]
    for pat in _BLOCKED_CSS_PATTERNS:
        if pat.search(css):
            raise ValueError(f"Blocked CSS pattern: {pat.pattern}")
    if "<" in css or ">" in css:
        raise ValueError("CSS must not contain < or > characters.")
    return css.strip()


def is_gray_color(value: str) -> bool:
    """Check if hex color is grayscale (r==g==b)."""
    m = _GRAYS.match(value.strip())
    if not m:
        return False
    hexv = m.group(1)
    if len(hexv) == 3:
        hexv = "".join(c * 2 for c in hexv)
    r, g, b = int(hexv[0:2], 16), int(hexv[2:4], 16), int(hexv[4:6], 16)
    return r == g == b


def validate_tokens(tokens: dict[str, str]) -> dict[str, str]:
    cleaned: dict[str, str] = {}
    for k, v in tokens.items():
        if k not in ALLOWED_TOKENS and not ALLOWED_TOKEN_RE.match(k):
            raise ValueError(f"Unsupported token: {k}")
        if k not in ALLOWED_TOKENS:
            raise ValueError(f"Token not allowlisted: {k}")
        if not isinstance(v, str) or not v.strip():
            raise ValueError(f"Token {k} must be a non-empty string.")
        if len(v) > 500:
            raise ValueError(f"Token {k} value too long.")
        if "<" in v or ">" in v:
            raise ValueError(f"Token {k} must not contain < or >.")
        cleaned[k] = v.strip()
    return cleaned


def validate_page(page: str | None) -> str | None:
    if page is None:
        return None
    p = page.strip()
    if p in WORKSPACE_PAGES or CUSTOM_PAGE_RE.match(p):
        return p
    raise ValueError(f"Unsupported page: {page}. Allowed: {', '.join(WORKSPACE_PAGES)} or custom:<slug>")
