import { create } from 'zustand';
import { SessionType, FocusSession } from '@/types';
import { focusService } from '@/services/focus';

export const TIMER_MODES: Record<SessionType, { name: string; duration: number }> = {
  pomodoro: { name: 'Pomodoro', duration: 25 * 60 },
  deep_work: { name: 'Deep Work', duration: 50 * 60 },
  short_break: { name: 'Short Break', duration: 5 * 60 },
  long_break: { name: 'Long Break', duration: 15 * 60 },
};

interface TimerState {
  mode: SessionType;
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  currentSession: FocusSession | null;
  isFullscreen: boolean;
  startedAtTimestamp: number | null;
  accumulatedPausedSeconds: number;
  pauseStartedTimestamp: number | null;

  setMode: (mode: SessionType) => void;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  reset: () => Promise<void>;
  tick: () => void;
  toggleFullscreen: () => void;
  syncWithActiveSession: () => Promise<void>;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: 'pomodoro',
  timeLeft: TIMER_MODES.pomodoro.duration,
  isRunning: false,
  isPaused: false,
  currentSession: null,
  isFullscreen: false,
  startedAtTimestamp: null,
  accumulatedPausedSeconds: 0,
  pauseStartedTimestamp: null,

  setMode: (mode) => {
    const { isRunning } = get();
    if (!isRunning) {
      set({
        mode,
        timeLeft: TIMER_MODES[mode].duration,
        isPaused: false,
      });
    }
  },

  start: async () => {
    const { mode } = get();
    const plannedDuration = TIMER_MODES[mode].duration;
    try {
      const session = await focusService.startSession({
        session_type: mode,
        planned_duration: plannedDuration,
      });
      const now = Date.now();
      set({
        currentSession: session,
        isRunning: true,
        isPaused: false,
        startedAtTimestamp: now,
        accumulatedPausedSeconds: 0,
        pauseStartedTimestamp: null,
        timeLeft: plannedDuration,
      });
    } catch {
      // Local fallback if API temporarily down
      const now = Date.now();
      set({
        isRunning: true,
        isPaused: false,
        startedAtTimestamp: now,
        accumulatedPausedSeconds: 0,
        timeLeft: plannedDuration,
      });
    }
  },

  pause: async () => {
    const { currentSession, isRunning, isPaused } = get();
    if (!isRunning || isPaused) return;

    const now = Date.now();
    set({
      isPaused: true,
      pauseStartedTimestamp: now,
    });

    if (currentSession) {
      try {
        const updated = await focusService.updateSession(currentSession.id, {
          status: 'paused',
        });
        set({ currentSession: updated });
      } catch (e) {
        console.error('Error pausing session on server:', e);
      }
    }
  },

  resume: async () => {
    const { currentSession, isRunning, isPaused, pauseStartedTimestamp, accumulatedPausedSeconds } = get();
    if (!isRunning || !isPaused) return;

    const now = Date.now();
    const additionalPause = pauseStartedTimestamp ? Math.floor((now - pauseStartedTimestamp) / 1000) : 0;

    set({
      isPaused: false,
      pauseStartedTimestamp: null,
      accumulatedPausedSeconds: accumulatedPausedSeconds + additionalPause,
    });

    if (currentSession) {
      try {
        const updated = await focusService.updateSession(currentSession.id, {
          status: 'active',
        });
        set({ currentSession: updated });
      } catch (e) {
        console.error('Error resuming session on server:', e);
      }
    }
  },

  reset: async () => {
    const { currentSession, mode } = get();
    if (currentSession) {
      try {
        await focusService.updateSession(currentSession.id, {
          status: 'cancelled',
        });
      } catch (e) {
        console.error('Error cancelling session:', e);
      }
    }
    set({
      isRunning: false,
      isPaused: false,
      currentSession: null,
      startedAtTimestamp: null,
      accumulatedPausedSeconds: 0,
      pauseStartedTimestamp: null,
      timeLeft: TIMER_MODES[mode].duration,
    });
  },

  tick: () => {
    const {
      isRunning,
      isPaused,
      startedAtTimestamp,
      accumulatedPausedSeconds,
      mode,
      currentSession,
    } = get();

    if (!isRunning || isPaused || !startedAtTimestamp) return;

    const totalPlanned = TIMER_MODES[mode].duration;
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startedAtTimestamp) / 1000) - accumulatedPausedSeconds;
    const remaining = Math.max(0, totalPlanned - elapsedSeconds);

    if (remaining === 0) {
      // Completed!
      if (currentSession) {
        focusService.updateSession(currentSession.id, {
          status: 'completed',
          actual_duration: totalPlanned,
        }).catch(console.error);
      }
      set({
        isRunning: false,
        isPaused: false,
        timeLeft: 0,
        currentSession: null,
        startedAtTimestamp: null,
      });

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('STRIDE Focus Timer', {
          body: `${TIMER_MODES[mode].name} completed! Well done!`,
        });
      }
    } else {
      set({ timeLeft: remaining });
    }
  },

  toggleFullscreen: () => {
    set((state) => ({ isFullscreen: !state.isFullscreen }));
  },

  syncWithActiveSession: async () => {
    try {
      const active = await focusService.getActiveSession();
      if (active) {
        const planned = active.planned_duration;
        const started = new Date(active.started_at).getTime();
        const now = Date.now();
        const pausedSecs = active.paused_duration;
        const isPaused = active.status === 'paused';
        const elapsed = Math.floor((now - started) / 1000) - pausedSecs;
        const left = Math.max(0, planned - elapsed);

        set({
          currentSession: active,
          mode: active.session_type,
          isRunning: true,
          isPaused,
          startedAtTimestamp: started,
          accumulatedPausedSeconds: pausedSecs,
          timeLeft: left,
        });
      }
    } catch {
      // ignore on network issues
    }
  },
}));
