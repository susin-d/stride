import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import {
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Target,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Plus,
  Shield,
  Zap,
  Layers,
  Compass,
  ArrowUpRight,
  Sliders,
  Check,
} from 'lucide-react';

interface DemoTask {
  id: string;
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  project: string;
  completed: boolean;
  timeEstimate: string;
}

interface DemoHabit {
  id: string;
  name: string;
  streak: number;
  bestStreak: number;
  days: boolean[]; // 7 days (Mon-Sun)
}

interface DemoGoal {
  id: string;
  title: string;
  targetDate: string;
  progress: number;
  milestones: { id: string; title: string; done: boolean }[];
}

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();

  // Active showcase tab
  const [activeTab, setActiveTab] = useState<'tasks' | 'timer' | 'habits' | 'goals'>('tasks');

  // Interactive Tasks State
  const [tasks, setTasks] = useState<DemoTask[]>([
    {
      id: '1',
      title: 'Review Q4 system architecture & database sharding proposal',
      priority: 'urgent',
      project: 'Core Infrastructure',
      completed: true,
      timeEstimate: '45m',
    },
    {
      id: '2',
      title: 'Finalize interactive landing page & craft-floor polish',
      priority: 'high',
      project: 'Product Launch',
      completed: false,
      timeEstimate: '90m',
    },
    {
      id: '3',
      title: 'Audit focus timer tab-sleep resilience on mobile Safari',
      priority: 'medium',
      project: 'Mobile QA',
      completed: false,
      timeEstimate: '30m',
    },
    {
      id: '4',
      title: 'Weekly 1:1 synchronization with engineering leads',
      priority: 'low',
      project: 'Team Rituals',
      completed: false,
      timeEstimate: '30m',
    },
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: DemoTask = {
      id: Date.now().toString(),
      title: newTaskInput.trim(),
      priority: 'high',
      project: 'Inbox',
      completed: false,
      timeEstimate: '25m',
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskInput('');
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const taskProgressPct = Math.round((completedCount / tasks.length) * 100);

  // Interactive Timer State
  const [timerMode, setTimerMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleTimerModeChange = (mode: 'focus' | 'short' | 'long') => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    if (mode === 'focus') setTimeLeft(25 * 60);
    if (mode === 'short') setTimeLeft(5 * 60);
    if (mode === 'long') setTimeLeft(15 * 60);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalModeDuration =
    timerMode === 'focus' ? 25 * 60 : timerMode === 'short' ? 5 * 60 : 15 * 60;
  const timerProgress = ((totalModeDuration - timeLeft) / totalModeDuration) * 100;

  // Interactive Habits State
  const [habits, setHabits] = useState<DemoHabit[]>([
    {
      id: 'h1',
      name: 'Morning Intentional Planning (10m)',
      streak: 18,
      bestStreak: 24,
      days: [true, true, true, true, true, true, true],
    },
    {
      id: 'h2',
      name: 'Uninterrupted 90m Deep Work Block',
      streak: 12,
      bestStreak: 19,
      days: [true, true, true, true, true, false, true],
    },
    {
      id: 'h3',
      name: 'Daily Physical Training / Movement',
      streak: 8,
      bestStreak: 14,
      days: [true, false, true, true, true, true, false],
    },
    {
      id: 'h4',
      name: 'Evening Retrospective & Log',
      streak: 15,
      bestStreak: 21,
      days: [true, true, true, true, false, true, true],
    },
  ]);

  const toggleHabitDay = (habitId: string, dayIndex: number) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const newDays = [...h.days];
        newDays[dayIndex] = !newDays[dayIndex];
        const newStreak = newDays[dayIndex] ? h.streak + 1 : Math.max(0, h.streak - 1);
        return {
          ...h,
          days: newDays,
          streak: newStreak,
          bestStreak: Math.max(h.bestStreak, newStreak),
        };
      })
    );
  };

  // Interactive Goals State
  const [goals, setGoals] = useState<DemoGoal[]>([
    {
      id: 'g1',
      title: 'Ship STRIDE Production Beta to 5,000 Teams',
      targetDate: 'Dec 15, 2026',
      progress: 75,
      milestones: [
        { id: 'm1', title: 'Serverless PostgreSQL pooler optimization', done: true },
        { id: 'm2', title: 'Backend-anchored timer tab recovery engine', done: true },
        { id: 'm3', title: 'Tactile editorial landing page & public routes', done: true },
        { id: 'm4', title: 'Cross-browser accessibility & WCAG 2.1 compliance', done: false },
      ],
    },
    {
      id: 'g2',
      title: 'Maintain 20 Hours of Weekly Focus Sprint Time',
      targetDate: 'Ongoing Milestone',
      progress: 60,
      milestones: [
        { id: 'm5', title: 'Morning calendar focus shield blocking', done: true },
        { id: 'm6', title: 'Zero notification policy during deep work sessions', done: true },
        { id: 'm7', title: 'Conduct weekly analytics retrospective every Friday', done: false },
      ],
    },
  ]);

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updated = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, done: !m.done } : m
        );
        const doneCount = updated.filter((m) => m.done).length;
        const newProgress = Math.round((doneCount / updated.length) * 100);
        return {
          ...g,
          milestones: updated,
          progress: newProgress,
        };
      })
    );
  };

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the backend-anchored timer stay accurate across tab sleep?',
      a: 'Unlike traditional web timers that rely on client-side JavaScript intervals (which browsers throttle or freeze when backgrounded), STRIDE anchors every timer session to a synchronized PostgreSQL timestamp on the server. When your laptop wakes or you switch back tabs, the elapsed time calculates with microsecond precision against the database state.',
    },
    {
      q: 'Can I link my focus sessions directly to specific tasks and projects?',
      a: 'Yes. With a single click or keyboard shortcut (Space/T), your active focus session binds to your selected task. Time spent automatically feeds your project analytics and weekly review summaries without manual time-tracking entries.',
    },
    {
      q: 'How does STRIDE replace disparate productivity apps?',
      a: 'Most knowledge workers toggle between a task list, a third-party Pomodoro website, a mobile habit tracker, and scattered notes. STRIDE unites morning prioritization, deep work sprinting, daily habit streaks, and quarterly milestone progress in a single high-performance cockpit.',
    },
    {
      q: 'Is there a free tier or trial period?',
      a: 'STRIDE is completely free to get started. You receive full access to unlimited tasks, projects, habit heatmaps, focus timers, and weekly reviews with zero credit card required.',
    },
    {
      q: 'Where is my data stored and how is it protected?',
      a: 'All data is encrypted in transit and at rest using enterprise-grade Neon Serverless PostgreSQL with JWT authentication. Automated backups run continuously with point-in-time recovery.',
    },
  ];

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="min-h-screen bg-[#F1F1F3] dark:bg-[#0F0F11] text-[#111111] dark:text-[#F4F4F6] transition-colors duration-200 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* ─────────────────────────────────────────────────────────────
          1. NAVIGATION BAR
      ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#F1F1F3]/85 dark:bg-[#0F0F11]/85 border-b border-black/5 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
              S
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider">STRIDE</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                v1.0
              </span>
            </div>
          </Link>

          {/* Section Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            <a href="#showcase" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Live Preview
            </a>
            <a href="#pillars" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Pillars
            </a>
            <a href="#workflow" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Workflow
            </a>
            <a href="#philosophy" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Philosophy
            </a>
            <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Toggle Light/Dark Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <Link
                to="/today"
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                <span>Go to App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
      ────────────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Main Statement */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.08]">
            Plan with intention.
            <br />
            Move with velocity.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 font-normal leading-relaxed max-w-2xl mx-auto">
            The unified workspace engineered for calm execution. Seamlessly synchronizing daily tasks,
            backend-anchored focus timers, habit streaks, and long-term milestones in a tactile, distraction-free environment.
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/today"
                className="w-full sm:w-auto px-7 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Open Your Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-7 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-7 py-3.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-semibold rounded-xl border border-black/10 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Signals */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
              Zero configuration required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
              Tab-sleep safe focus timer
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
              Instant interactive sandbox
            </span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. INTERACTIVE LIVE PRODUCT SHOWCASE
        ────────────────────────────────────────────────────────────── */}
        <div id="showcase" className="mt-14 max-w-5xl mx-auto">
          {/* Frame Header */}
          <div className="bg-[#F7F7F9] dark:bg-[#18181B] rounded-3xl border border-black/10 dark:border-white/10 shadow-xl overflow-hidden transition-all">
            {/* Window Topbar */}
            <div className="px-5 py-3.5 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-black/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span className="ml-2 text-xs font-mono text-neutral-400 dark:text-neutral-500">
                  stride.app/workspace/today
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Interactive Demo
                </span>
              </div>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="p-3 border-b border-black/5 dark:border-white/10 bg-neutral-100/60 dark:bg-neutral-900/40 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-xl">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'tasks'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Today's Tasks ({completedCount}/{tasks.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('timer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'timer'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Focus Timer ({formatTimer(timeLeft)})</span>
                </button>

                <button
                  onClick={() => setActiveTab('habits')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'habits'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Habit Streaks</span>
                </button>

                <button
                  onClick={() => setActiveTab('goals')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'goals'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Goals & Milestones</span>
                </button>
              </div>

              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 px-2">
                Click controls to test live interactions
              </div>
            </div>

            {/* Tab 1: Tasks Interactive Sandbox */}
            {activeTab === 'tasks' && (
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                      Today's Execution List
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Organized by priority with integrated project routing
                    </p>
                  </div>
                  {/* Progress indicator */}
                  <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 px-3.5 py-2 rounded-xl border border-black/5 dark:border-white/10 shadow-xs">
                    <div className="text-right">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {taskProgressPct}% Complete
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {completedCount} of {tasks.length} tasks
                      </div>
                    </div>
                    <div className="w-12 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 dark:bg-white transition-all duration-300"
                        style={{ width: `${taskProgressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Inline task adder */}
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    placeholder="Add a new task (e.g. Schedule weekly product demo)..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-xl shadow-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </form>

                {/* Tasks List */}
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`group p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        task.completed
                          ? 'bg-neutral-100/50 dark:bg-neutral-900/30 border-black/5 dark:border-white/5 opacity-60'
                          : 'bg-white dark:bg-neutral-900 border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          className="text-neutral-900 dark:text-white shrink-0 transition-transform group-hover:scale-110"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 fill-neutral-900 dark:fill-white text-white dark:text-neutral-900" />
                          ) : (
                            <Circle className="w-4 h-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white" />
                          )}
                        </button>
                        <span
                          className={`text-xs font-medium truncate ${
                            task.completed
                              ? 'line-through text-neutral-400 dark:text-neutral-500'
                              : 'text-neutral-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {task.project}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            task.priority === 'urgent'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : task.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {task.timeEstimate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Focus Timer Interactive Sandbox */}
            {activeTab === 'timer' && (
              <div className="p-6 md:p-10 flex flex-col items-center justify-center space-y-6">
                {/* Mode Selector */}
                <div className="flex items-center gap-2 p-1 bg-neutral-200/70 dark:bg-neutral-800/70 rounded-xl">
                  <button
                    onClick={() => handleTimerModeChange('focus')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      timerMode === 'focus'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Deep Focus (25m)
                  </button>
                  <button
                    onClick={() => handleTimerModeChange('short')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      timerMode === 'short'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Short Rest (5m)
                  </button>
                  <button
                    onClick={() => handleTimerModeChange('long')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      timerMode === 'long'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Long Rest (15m)
                  </button>
                </div>

                {/* Circular Timer Visual */}
                <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="112"
                      cy="112"
                      r="96"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-neutral-200 dark:text-neutral-800"
                    />
                    <circle
                      cx="112"
                      cy="112"
                      r="96"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 96}
                      strokeDashoffset={2 * Math.PI * 96 * (1 - timerProgress / 100)}
                      strokeLinecap="round"
                      className="text-neutral-900 dark:text-white transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl md:text-5xl font-mono font-extrabold tracking-tight text-neutral-900 dark:text-white">
                      {formatTimer(timeLeft)}
                    </div>
                    <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-1">
                      {isTimerRunning ? 'Session in progress' : 'Ready to focus'}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isTimerRunning ? 'Pause Session' : 'Start Focus Session'}</span>
                  </button>
                  <button
                    onClick={() => handleTimerModeChange(timerMode)}
                    className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Tab-sleep safe:
                  </span>{' '}
                  Server-anchored timestamps ensure you never lose focus logs even if you close your laptop.
                </div>
              </div>
            )}

            {/* Tab 3: Habits Interactive Sandbox */}
            {activeTab === 'habits' && (
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                    Daily Rituals & Consistency Streaks
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Click any day circle to toggle completion and watch streak numbers adapt
                  </p>
                </div>

                <div className="space-y-3">
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                          <span>{habit.name}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {habit.streak} days
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Best Record: {habit.bestStreak} consecutive days
                        </div>
                      </div>

                      {/* 7-day checkboxes */}
                      <div className="flex items-center gap-2">
                        {habit.days.map((isDone, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-mono text-neutral-400">
                              {weekdays[idx]}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleHabitDay(habit.id, idx)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                isDone
                                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs scale-105'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-transparent hover:border hover:border-black/20 dark:hover:border-white/20'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Goals Interactive Sandbox */}
            {activeTab === 'goals' && (
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                    High-Level Objectives & Trackable Milestones
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Click milestone items to see dynamic objective progress recalculations
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 shadow-xs space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            {goal.targetDate}
                          </div>
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5 leading-snug">
                            {goal.title}
                          </h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg shrink-0">
                          {goal.progress}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 dark:bg-white transition-all duration-300"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>

                      {/* Milestones */}
                      <div className="space-y-2 pt-1">
                        {goal.milestones.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => toggleMilestone(goal.id, m.id)}
                            className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-neutral-900 dark:hover:text-white transition-colors"
                          >
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                m.done
                                  ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900'
                                  : 'border-neutral-300 dark:border-neutral-700 bg-transparent'
                              }`}
                            >
                              {m.done && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={m.done ? 'line-through text-neutral-400' : ''}>
                              {m.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. FOUR CORE PILLARS (NARRATIVE WORKFLOW)
      ────────────────────────────────────────────────────────────── */}
      <section id="pillars" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 dark:border-white/10">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Engineered around how high-agency minds actually work.
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            STRIDE rejects fragmented productivity apps in favor of an integrated execution engine.
            Four interlocking systems work synchronously to protect your focus and preserve your momentum.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pillar 1 */}
          <div className="p-8 rounded-3xl bg-[#F7F7F9] dark:bg-[#18181B] border border-black/5 dark:border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Ruthless Morning Prioritization
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Transform chaotic inboxes into an intentional plan for today. Group tasks into projects,
              assign crisp priority tags, and break intimidating challenges into bite-sized subtasks before distraction hits.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 rounded-3xl bg-[#F7F7F9] dark:bg-[#18181B] border border-black/5 dark:border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Backend-Anchored Focus Sprints
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Standard browser timers freeze and desynchronize during laptop sleep. STRIDE anchors active sessions
              to PostgreSQL timestamps, preserving continuous deep work tracking with zero drift across tabs and restarts.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 rounded-3xl bg-[#F7F7F9] dark:bg-[#18181B] border border-black/5 dark:border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Compounding Habit Heatmaps
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Momentum is maintained through consistency. Log daily micro-routines with tactile streak counters
              and visual monthly heatmaps that turn small, recurring commitments into durable identity.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-8 rounded-3xl bg-[#F7F7F9] dark:bg-[#18181B] border border-black/5 dark:border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Strategic Milestones & Retrospectives
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Connect daily actions directly to quarterly objectives. Monitor milestone completion curves and
              review automated weekly productivity summaries that reveal where your hours actually went.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. THE CONTRAST: FRAGMENTATION VS STRIDE
      ────────────────────────────────────────────────────────────── */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 dark:border-white/10">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Stop switching between four disjointed apps.
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Every context switch carries a cognitive penalty. See why high performers consolidate their workspace into STRIDE.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Fragmented Stack */}
          <div className="p-8 rounded-3xl bg-neutral-200/50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/5 space-y-5">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              The Fragmented Workflow
            </div>
            <ul className="space-y-3.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✕</span>
                <span>Tasks in Todoist or Jira with zero tie-in to active focus sprints.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✕</span>
                <span>Generic browser Pomodoro website that sleeps, resets, or loses session state.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✕</span>
                <span>Separate mobile habit tracker requiring manual app switching every evening.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✕</span>
                <span>Long-term goals stored in forgotten spreadsheet or notion document.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✕</span>
                <span>No unified Friday retrospective showing real progress metrics.</span>
              </li>
            </ul>
          </div>

          {/* Unified STRIDE Stack */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#18181B] border border-black/10 dark:border-white/10 shadow-lg space-y-5">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center justify-between">
              <span>The STRIDE Command Center</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
                Unified
              </span>
            </div>
            <ul className="space-y-3.5 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
              <li className="flex items-start gap-3">
                <span className="text-neutral-900 dark:text-white font-bold">✓</span>
                <span>Tasks, priorities, and subtasks synchronized directly to active focus timer.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-900 dark:text-white font-bold">✓</span>
                <span>Backend-anchored timer immune to browser sleep and laptop standby.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-900 dark:text-white font-bold">✓</span>
                <span>Tactile habit heatmaps alongside daily tasks for holistic ritual review.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-900 dark:text-white font-bold">✓</span>
                <span>Live milestone progress linked to projects and daily execution items.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-900 dark:text-white font-bold">✓</span>
                <span>Automated weekly review analytics calculated directly from database records.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. PHILOSOPHY / MANIFESTO
      ────────────────────────────────────────────────────────────── */}
      <section id="philosophy" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 dark:border-white/10">
        <div className="max-w-4xl mx-auto rounded-3xl bg-[#111111] dark:bg-[#18181B] text-white p-8 sm:p-14 md:p-16 space-y-8 shadow-2xl">
          <div className="space-y-3">
            <div className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
              STRIDE Design Philosophy
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Software should quiet the mind, not amplify the noise.
            </h2>
          </div>

          <div className="space-y-5 text-sm sm:text-base text-neutral-300 font-normal leading-relaxed border-t border-white/10 pt-6">
            <p>
              Modern productivity software has succumbed to feature bloat. Kanban boards that require full-time administrators,
              gamification badges that optimize for dopamine rather than output, and endless configuration panels that distract
              from actual deep work.
            </p>
            <p>
              STRIDE is built on the conviction that high-agency work requires calm, tactile software that gets out of the way.
              Fast keyboard ergonomics, instant load times, server-level timing integrity, and aesthetic restraint.
            </p>
            <p className="font-semibold text-white">
              Plan your day before 9 AM. Execute in protected focus sprints. Move forward with measurable momentum.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/10">
            <div className="text-xs text-neutral-400">
              Built with React 19, FastAPI & Neon Serverless PostgreSQL
            </div>
            <Link
              to={isAuthenticated ? '/today' : '/register'}
              className="px-6 py-2.5 bg-white text-neutral-900 text-xs font-bold rounded-xl hover:bg-neutral-100 transition-colors flex items-center gap-2"
            >
              <span>{isAuthenticated ? 'Enter Workspace' : 'Experience STRIDE'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FREQUENTLY ASKED QUESTIONS
      ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-black/5 dark:border-white/10">
        <div className="text-center space-y-4 mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Clear answers on architecture, session resilience, and privacy.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-[#F7F7F9] dark:bg-[#18181B] border border-black/5 dark:border-white/10 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-neutral-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-black/5 dark:border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FINAL CALL TO ACTION
      ────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 dark:border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Your most focused week starts right now.
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto">
            Take control of your day with high-craft tools designed for velocity. Free forever for individuals.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/today"
                className="w-full sm:w-auto px-8 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Launch Your Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-semibold rounded-xl border border-black/10 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. EDITORIAL FOOTER
      ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-black/5 dark:border-white/10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span className="font-bold text-neutral-900 dark:text-white">STRIDE</span>
            <span>— Plan Better. Move Forward.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link to="/today" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              App
            </Link>
            <Link to="/login" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Sign Up
            </Link>
            <a href="#showcase" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Interactive Preview
            </a>
            <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>PostgreSQL Synchronized</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>© {new Date().getFullYear()} STRIDE Technologies Inc. All rights reserved.</div>
          <div className="text-neutral-400">Keyboard shortcuts: [Space] Timer • [/] Search • [C] Add Task</div>
        </div>
      </footer>
    </div>
  );
};
