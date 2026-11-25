import {
  LayoutDashboard,
  CheckCircle2,
  CalendarDays,
  Code2,
  Rocket,
  FolderKanban,
  Bot,
  Sparkles,
  PhoneCall,
  FileText,
  MessageCircle,
  MonitorPlay,
} from 'lucide-react'

export const navLinks = [
  { label: 'Folio', href: '#folio' },
  { label: 'Eve AI', href: '#eve' },
  { label: 'Index', href: '#index' },
  { label: 'FAQ', href: '#faq' },
]

export const heroProof = [
  { index: '01', text: 'Board, calendar & list in one view' },
  { index: '02', text: 'Google Calendar + ICS live sync' },
  { index: '03', text: 'Monaco workspace with Eve tools' },
  { index: '04', text: 'Six-provider AI with pgvector memory' },
]

export const heroWorkbench = {
  workspace: 'stride-core',
  status: 'Active · 4 sources synced',
  tasks: [
    { title: 'Ship auth callback hardening', meta: 'Today · 14:00' },
    { title: 'Codeforces Round #984', meta: '19:35 UTC' },
    { title: 'Submit YC / Hackathon deck', meta: 'Thu · 18:00' },
  ],
  eveCmd: 'create_eve_schedule({ cron: "0 9 * * 1", action: "call" })',
  eveNote: 'Monday 09:00 voice briefing armed with pipeline summary.',
}

export const folioScenes = [
  {
    id: 'dashboard',
    numeral: '01',
    pillar: 'Signal',
    label: 'Dashboard',
    icon: LayoutDashboard,
    headline: 'Your command center',
    copy: 'Drag, resize, curate. Layouts for builder, competitor, and job-seeker modes — every widget live, every arrangement remembered.',
    bullets: ['Widget layouts per mode', 'Arrangement memory per user', 'Command palette everywhere'],
    vignette: {
      barLeft: 'STRIDE // DASHBOARD',
      barRight: 'MODE: BUILDER',
      cells: [
        { label: 'Active Projects', value: '04 in flight', detail: '2 in build · 2 in review' },
        { label: 'Next Contest', value: 'CF #984 · 04h 12m', detail: 'Auto-synced via feed' },
        { label: 'Pipeline', value: '11 applications', detail: '3 interviews this week' },
        { label: 'Tasks Due', value: '05 remaining', detail: 'Priority filter active' },
      ],
    },
  },
  {
    id: 'workspace',
    numeral: '02',
    pillar: 'Build',
    label: 'Code Workspace',
    icon: MonitorPlay,
    headline: 'A real editor, inside',
    copy: 'Monaco with file tree, search, and breadcrumbs — plus Eve file tools that read and write alongside you. No mock IDE.',
    bullets: ['Monaco Editor + minimap', 'File tree + search', 'Eve reads & writes files'],
    vignette: {
      barLeft: 'WORKSPACE // server/app/api/routes/eve.py',
      barRight: 'MONACO · UTF-8',
      code: [
        'const session = await eveApi.streamChat({',
        '  workspaceId: "stride-core",',
        '  prompt: "Audit auth callback routes and list gaps",',
        '  tools: ["list_workspace_files", "read_file"],',
        '})',
      ].join('\n'),
    },
  },
  {
    id: 'calendar',
    numeral: '03',
    pillar: 'Sync',
    label: 'Calendar',
    icon: CalendarDays,
    headline: 'One timeline to rule them',
    copy: 'Tasks, Google Calendar, contest dates, interviews, and hackathons merged into a single ICS-aware timeline with reminders.',
    bullets: ['Google sync + ICS import', 'Reminder engine', 'Contest auto-feed'],
    vignette: {
      barLeft: 'TIMELINE // UNIFIED FEED',
      barRight: 'ICS + GOOGLE LIVE',
      cells: [
        { label: '09:00', value: 'Eve Weekly Briefing', detail: 'Scheduled voice call' },
        { label: '11:30', value: 'Systems Design Interview', detail: 'Google Calendar sync' },
        { label: '16:00', value: 'Hackathon Checkpoint', detail: 'Team milestone' },
        { label: '20:00', value: 'LeetCode Biweekly', detail: 'Contest radar feed' },
      ],
    },
  },
  {
    id: 'eve',
    numeral: '04',
    pillar: 'Evolve',
    label: 'Eve AI',
    icon: Bot,
    headline: 'Chat. Voice. Memory.',
    copy: 'Streaming replies across six providers, persistent sessions, and semantic memory — schedules and calls included.',
    bullets: ['Sessions + vector recall', 'Voice calls with captions', 'Schedules that run alone'],
    vignette: {
      barLeft: 'EVE // TOOL LOOP + MEMORY',
      barRight: 'PGVECTOR · 6 PROVIDERS',
      cells: [
        { label: 'Memory Recall', value: '1,240 embedded facts', detail: '1536-dim cosine match' },
        { label: 'Voice Channel', value: 'WebRTC + Captions', detail: 'Echo guard enabled' },
        { label: 'Cron Engine', value: 'Every 15m tick', detail: 'Prompts & outbound calls' },
        { label: 'Providers', value: 'OpenAI · Anthropic · Gemini', detail: '+ Ollama, OpenRouter, Groq' },
      ],
    },
  },
]

export const eveTerminalLines = [
  'list_workspace_files({ workspace: "stride" })',
  'search_workspace_files({ query: "auth callback" })',
  'browse_web({ query: "serverless cron schedules" })',
  'create_eve_schedule({ cron: "0 9 * * 1", action: "call" })',
]

export const eveDemoMessages = [
  { from: 'you', text: 'Review my week and nudge me Monday 9am if the pipeline slips.' },
  { from: 'eve', text: 'Schedule armed — cron Mon 9am, action: call. I\'ll bring the pipeline summary.' },
  { from: 'you', text: 'Draft follow-ups for the teams I met this week.' },
  { from: 'eve', text: 'Three drafts ready in Documents — review, then I\'ll send on your word.' },
]

export const eveCapabilities = [
  {
    icon: Sparkles,
    title: 'Conversational memory',
    desc: 'One tool loop across six providers. Sessions persist, memories embed with pgvector, and resurface exactly when relevant.',
    points: ['Workspace-aware search', 'Web browsing built-in', 'Auto-remember key facts'],
  },
  {
    icon: PhoneCall,
    title: 'Voice that calls you',
    desc: 'Bidirectional WebRTC with live captions and an echo guard. Browser speech instantly, server Whisper + TTS when you want quality.',
    points: ['Hold-to-talk + transcripts', 'Eve can trigger calls', 'Waveform + captions'],
  },
  {
    icon: CalendarDays,
    title: 'Schedules that run alone',
    desc: 'One-time and cron prompts or voice calls — executed every 15 minutes by serverless cron, even while you sleep.',
    points: ['Cron + one-time', 'Prompt or call', 'Schedule via chat'],
  },
]

export const features = [
  { num: '01', icon: CheckCircle2, title: 'Tasks', desc: 'Priorities, filters, and focus modes that stay out of your way.' },
  { num: '02', icon: CalendarDays, title: 'Unified Calendar', desc: 'Merged Google, ICS, and contest timelines with reminders.' },
  { num: '03', icon: Code2, title: 'Competitive Hub', desc: 'Ratings and upcoming rounds across Codeforces, LeetCode, CodeChef.' },
  { num: '04', icon: FolderKanban, title: 'Projects', desc: 'Lifecycle phases from idea to maintain with stacks and links.' },
  { num: '05', icon: Rocket, title: 'Jobs & Hackathons', desc: 'Pipelines for applications, interviews, and submissions.' },
  { num: '06', icon: LayoutDashboard, title: 'Dashboard', desc: 'Reorderable grid with live widgets for your current mode.' },
  { num: '07', icon: FileText, title: 'Documents', desc: 'Project-linked docs with Monaco preview and Drive import.' },
  { num: '08', icon: MessageCircle, title: 'Mail & WhatsApp', desc: 'Schedulable mail queue, WhatsApp bridge, and persistent chats.' },
]

export const workflow = [
  {
    step: '01',
    title: 'Land & connect',
    text: 'Create an account, link Google, import ICS, add coding handles. Sources pour into one timeline in under a minute.',
  },
  {
    step: '02',
    title: 'Shape your stage',
    text: 'Arrange the dashboard, pick White or Dark mode, open a workspace folder. Eve learns your context as you work.',
  },
  {
    step: '03',
    title: 'Move at will',
    text: 'Eve remembers, reminds, and calls. You stay in flow — no tab cemetery, no scattered state.',
  },
]

export const faqs = [
  {
    q: 'What is Stride exactly?',
    a: 'A personal operating system for builders: tasks, projects, jobs, hackathons, coding signal, calendar, documents, mail, WhatsApp, and the Eve AI assistant — unified on one monochrome canvas.',
  },
  {
    q: 'Which integrations are first-class?',
    a: 'Google Calendar (live sync + ICS), Drive, GitHub, Codeforces / LeetCode / CodeChef contest feeds, and WhatsApp via the Go bridge. Connect or revoke each one in Settings.',
  },
  {
    q: 'What can Eve do beyond chat?',
    a: 'Search and edit workspace files, browse the web, summarize WhatsApp threads, create schedules, and initiate voice calls — all through one six-provider tool loop with persistent memory.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Data is isolated per user and scoped by auth with least-privilege integrations. Nothing is sold or used for training. Disconnect any service anytime.',
  },
  {
    q: 'How does voice work?',
    a: 'Browser speech works instantly with zero setup. Optionally add server Groq Whisper STT and Google Cloud TTS for quality, with live captions and echo guard on every call.',
  },
  {
    q: 'What about Google data usage?',
    a: 'Calendar (readonly) for events, Drive (files you open), and openid/email/profile for sign-in. Revoke anytime in Settings.',
  },
]
