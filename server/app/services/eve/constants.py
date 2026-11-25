"""Eve service constants — single responsibility: workspace limits and enumerations."""

MAX_RECORDS_PER_READ = 50
SUPPORTED_RESOURCES = ("todos", "projects", "jobs", "hackathons", "documents", "notifications", "calendar_events")
WRITABLE_RESOURCES = ("todos", "projects", "jobs", "hackathons", "documents", "calendar_events")
WORKSPACE_PAGES = (
    "dashboard",
    "eve",
    "stats",
    "todo",
    "calendar",
    "mails",
    "chats",
    "calls",
    "contacts",
    "competitive-coding",
    "compete",
    "hackathons",
    "projects",
    "jobs",
    "documents",
    "workspace",
    "whatsapp",
    "profile",
    "themes",
    "setting",
    "usage",
)
