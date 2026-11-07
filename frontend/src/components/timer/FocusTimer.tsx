import React, { useEffect } from 'react';
import { useTimerStore, TIMER_MODES } from '@/store/timerStore';
import { SessionType } from '@/types';
import { Play, Pause, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export const FocusTimer: React.FC = () => {
  const {
    mode,
    timeLeft,
    isRunning,
    isPaused,
    isFullscreen,
    setMode,
    start,
    pause,
    resume,
    reset,
    tick,
    toggleFullscreen,
    syncWithActiveSession,
  } = useTimerStore();

  useEffect(() => {
    let isMounted = true;
    syncWithActiveSession();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, tick]);

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const modes: SessionType[] = ['pomodoro', 'deep_work', 'short_break', 'long_break'];

  const content = (
    <div className="flex flex-col justify-between h-full p-5 relative overflow-hidden">
      {/* Decorative glass glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Mode Switcher & Fullscreen Button */}
      <div className="flex items-center justify-between mb-4 z-10">
        <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          Focus Session
        </span>
        <button
          onClick={toggleFullscreen}
          className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Focus'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Session Mode Selector Pills */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 mb-6 z-10">
        {modes.map((m) => (
          <button
            key={m}
            disabled={isRunning}
            onClick={() => setMode(m)}
            className={cn(
              'py-1 text-[10px] font-medium rounded-lg transition-all text-center truncate px-1',
              mode === m
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white disabled:opacity-50'
            )}
          >
            {m === 'pomodoro'
              ? 'Pomo'
              : m === 'deep_work'
              ? 'Deep'
              : m === 'short_break'
              ? 'Short'
              : 'Long'}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center justify-center my-auto py-2 z-10">
        <div
          className={cn(
            'font-bold tracking-tight text-white font-mono transition-all',
            isFullscreen ? 'text-8xl md:text-9xl' : 'text-5xl'
          )}
        >
          {formatTimerDisplay(timeLeft)}
        </div>
        <p className="text-xs text-neutral-400 mt-2 font-medium tracking-wide">
          {isPaused ? 'Paused' : isRunning ? 'In Progress' : TIMER_MODES[mode].name}
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-3 mt-6 z-10">
        <button
          onClick={reset}
          disabled={!isRunning && timeLeft === TIMER_MODES[mode].duration}
          className="p-2.5 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 border border-white/5"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {!isRunning ? (
          <button
            onClick={start}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-xs shadow-lg hover:bg-neutral-200 transition-all"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Start Session</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={resume}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-xs shadow-lg hover:bg-neutral-200 transition-all"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Resume</span>
          </button>
        ) : (
          <button
            onClick={pause}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-xs shadow-lg hover:bg-neutral-200 transition-all"
          >
            <Pause className="w-4 h-4 fill-black" />
            <span>Pause</span>
          </button>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#111111] flex flex-col justify-center items-center p-8 animate-in fade-in duration-200">
        <div className="w-full max-w-2xl h-[550px] dark-glass-card">{content}</div>
      </div>
    );
  }

  return <div className="dark-glass-card h-[290px] w-full">{content}</div>;
};
