import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Sparkles,
  Trophy,
  Activity,
  CheckCircle,
  Coffee,
  X,
  Volume2,
  VolumeX,
  Clock,
  ChevronRight,
  Flame,
  TrendingUp,
  Award,
  Sparkle,
  MessageSquare,
  BookOpen,
  ListTodo,
  RefreshCw
} from 'lucide-react';
import { Todo } from '../types';
import FocusMusicWidget from './FocusMusicWidget';

interface CompletedSession {
  id: string;
  name: string;
  minutes: number;
  completedAt: string; // YYYY-MM-DDTHH:mm:ssZ
  type: 'focus' | 'break';
}

interface TimerViewProps {
  accentColor: string;
  todos: Todo[];
  onUpdateTodo?: (id: string, updatedFields: Partial<Todo>) => void;
}

const INSIGHTFUL_QUOTES = [
  { text: "The successful warrior is the average person, with laser-like focus.", author: "Bruce Lee" },
  { text: "Deep work is the superpower of our hyper-distracted 21st century.", author: "Cal Newport" },
  { text: "Focus is a muscle, and you build it by choosing what to ignore.", author: "Focus Hack" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "Your focus determines your reality. Breathe in, sink into the flow.", author: "Qui-Gon Jinn" },
  { text: "Flow state is not an elite achievement. It is our natural state when we clear the clutter.", author: "Mindfulness Practice" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
  { text: "Only those who have the patience to do simple things perfectly ever acquire the skill to do difficult things easily.", author: "Johann Schiller" }
];

export default function TimerView({ accentColor, todos, onUpdateTodo }: TimerViewProps) {
  // Pomodoro states
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  
  // Custom tracking date (Today is 2026-06-19)
  const todayStr = '2026-06-19';

  // Sound and Tick Feedback
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pomodoro_sound_enabled') !== 'false';
  });
  const [tickSoundEnabled, setTickSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pomodoro_tick_enabled') === 'true';
  });

  // Motivational Quote
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * INSIGHTFUL_QUOTES.length));

  // Linked Task state
  const [selectedTodoId, setSelectedTodoId] = useState<string>('');

  // Finished Sessions Database
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>(() => {
    const saved = localStorage.getItem('completed_focus_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync settings helper
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('pomodoro_sound_enabled', String(next));
  };

  const toggleTick = () => {
    const next = !tickSoundEnabled;
    setTickSoundEnabled(next);
    localStorage.setItem('pomodoro_tick_enabled', String(next));
  };

  // Sound synthesizers via browser AudioContext
  const playAmbienceBellChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Triadic harmonious Zen chime chord: E5, G#5, B5, E6
      const freqs = [659.25, 830.61, 987.77, 1318.51];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5 + idx * 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 3.0);
      });
    } catch (e) {
      console.warn("Audio bell failed to initialize", e);
    }
  };

  const playSoftTickingSound = () => {
    if (!soundEnabled || !tickSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.012, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  };

  // Timer Core Hook
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            handleCycleComplete();
            return 0;
          }
          playSoftTickingSound();
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, sessionType, totalDuration, tickSoundEnabled]);

  // Handle Session End Cycle
  const handleCycleComplete = () => {
    playAmbienceBellChime();

    // Track state
    const mins = Math.ceil(totalDuration / 60);
    const newSession: CompletedSession = {
      id: `pomodoro-${Date.now()}`,
      name: sessionType === 'focus' ? 'Focus Session' : 'Stress Break',
      minutes: mins,
      completedAt: new Date().toISOString(),
      type: sessionType
    };

    const updated = [newSession, ...completedSessions];
    setCompletedSessions(updated);
    localStorage.setItem('completed_focus_sessions', JSON.stringify(updated));

    // Update corresponding linkable Todo
    if (sessionType === 'focus' && selectedTodoId && onUpdateTodo) {
      const parentTodo = todos.find(t => t.id === selectedTodoId);
      if (parentTodo) {
        const descText = parentTodo.description || '';
        const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        onUpdateTodo(selectedTodoId, {
          description: descText 
            ? `${descText}\n[Completed Pomodoro session at ${nowFormatted}]`
            : `[Completed Pomodoro session at ${nowFormatted}]`
        });
      }
    }

    // Modal alarm pop ups or state switches
    alertCompletedPopup(sessionType, mins);

    // Switch next state automatically
    if (sessionType === 'focus') {
      triggerSwitchSession('break');
    } else {
      triggerSwitchSession('focus');
    }
  };

  const [popupAlert, setPopupAlert] = useState<{ show: boolean; msg: string; label: string } | null>(null);

  const alertCompletedPopup = (type: 'focus' | 'break', durationMins: number) => {
    const labelText = type === 'focus' ? 'Session Complete! 🎉' : 'Break Expired! ☕';
    const msgText = type === 'focus'
      ? `Phenomenal performance! You completed ${durationMins} focus minutes. Time for a well-deserved short break.`
      : `Your stress-relief break is complete. Your mind is cleared and ready to conquer high focus tasks.`;

    setPopupAlert({
      show: true,
      label: labelText,
      msg: msgText
    });
  };

  const triggerSwitchSession = (nextType: 'focus' | 'break') => {
    setIsRunning(false);
    setSessionType(nextType);
    const length = nextType === 'focus' ? 25 * 60 : 5 * 60;
    setTotalDuration(length);
    setTimeLeft(length);
  };

  // Quick Action Buttons
  const resetPomodoro = () => {
    setIsRunning(false);
    const length = sessionType === 'focus' ? 25 * 60 : 5 * 60;
    setTotalDuration(length);
    setTimeLeft(length);
  };

  const skipActiveSession = () => {
    if (window.confirm(`Are you sure you want to skip the current ${sessionType} session?`)) {
      triggerSwitchSession(sessionType === 'focus' ? 'break' : 'focus');
    }
  };

  // Progress percentage calculations for circle ring
  const flowPercent = totalDuration > 0 ? (timeLeft / totalDuration) : 0;
  const radius = 95;
  const strokeDashoffset = (2 * Math.PI * radius) * (1 - flowPercent);

  // Statistics Computations
  const getTodayCompletedCount = () => {
    const list = completedSessions.filter(s => {
      const dateLocal = s.completedAt.split('T')[0];
      return dateLocal === todayStr && s.type === 'focus';
    });
    return list.length;
  };

  const getTodayCompletedMinutes = () => {
    const list = completedSessions.filter(s => {
      const dateLocal = s.completedAt.split('T')[0];
      return dateLocal === todayStr && s.type === 'focus';
    });
    return list.reduce((acc, curr) => acc + curr.minutes, 0);
  };

  // Last 7 days sequence with focus achievements
  const getPast7Days = (): { date: Date; dateStr: string; label: string; mins: number }[] => {
    const list = [];
    const baseDate = new Date('2026-06-19T12:00:00-07:00');
    for (let i = 6; i >= 0; i--) {
      const target = new Date(baseDate);
      target.setDate(target.getDate() - i);
      const str = target.toISOString().split('T')[0];
      
      // Calculate minutes for that day
      const dailyMins = completedSessions
        .filter(s => s.completedAt.split('T')[0] === str && s.type === 'focus')
        .reduce((sum, curr) => sum + curr.minutes, 0);

      list.push({
        date: target,
        dateStr: str,
        label: target.toLocaleDateString([], { weekday: 'short' }),
        mins: dailyMins
      });
    }
    return list;
  };

  const past7DaysData = getPast7Days();
  const maxDayMinutes = Math.max(...past7DaysData.map(d => d.mins), 25);

  // Digital countdown text MM:SS
  const formatDigitalTime = (seconds: number) => {
    const minutesRepr = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secondsRepr = (seconds % 60).toString().padStart(2, '0');
    return `${minutesRepr}:${secondsRepr}`;
  };

  // Next quotes reshuffled
  const shuffleQuote = () => {
    let nextIdx = Math.floor(Math.random() * INSIGHTFUL_QUOTES.length);
    while (nextIdx === quoteIndex && INSIGHTFUL_QUOTES.length > 1) {
      nextIdx = Math.floor(Math.random() * INSIGHTFUL_QUOTES.length);
    }
    setQuoteIndex(nextIdx);
  };

  const selectedQuote = INSIGHTFUL_QUOTES[quoteIndex];
  const incompleteTodos = todos.filter(t => !t.completed);

  return (
    <div className="flex flex-col gap-6" id="digital-pomodoro-timer-core">
      
      {/* 🚀 STUNNING ULTRA-PREMIUM GRADIENT BANNER PANEL */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-violet-700 via-indigo-700 to-fuchsia-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden"
        id="premium-timer-brand-card"
      >
        <div className="absolute right-0 top-0 w-40 h-40 bg-fuchsia-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/4 -bottom-10 w-32 h-32 bg-indigo-500/30 rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 text-left">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-purple-200 bg-purple-900/30 px-2.5 py-1 rounded-full inline-block mb-3 border border-purple-500/20">
              State of Flow
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight font-display mb-1 flex items-center gap-1.5">
              <span>Pomodoro Engine</span>
              <Sparkles size={18} className="text-amber-300 animate-pulse" />
            </h2>
            <p className="text-xs text-purple-100/95 max-w-sm leading-relaxed font-medium">
              Eliminate friction. Enter deep mental immersion using standard 25 mins Focus and 5 mins Break block targets.
            </p>
          </div>

          {/* Quick Real-Time Session Status info box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3 w-full md:w-auto shrink-0">
            <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300">
              <Trophy size={18} className="fill-current" />
            </div>
            <div>
              <p className="text-[10px] text-purple-200 font-bold leading-none">Completed Sessions Today</p>
              <p className="text-lg font-black text-white mt-1">
                {getTodayCompletedCount()} Pomodoros
              </p>
              <p className="text-[9px] text-purple-300 mt-0.5 font-semibold">
                Total: {getTodayCompletedMinutes()} focus minutes
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🔮 MAIN CIRCULAR DIAL & CONSOLE BENTO BOX */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center relative overflow-hidden" id="pomodoro-dial-panel">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600" />

        {/* Tab Selection: Focus vs Break toggling */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-full mb-6">
          <button
            onClick={() => triggerSwitchSession('focus')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              sessionType === 'focus'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame size={13} className={sessionType === 'focus' ? "fill-current text-white" : "text-slate-400"} />
            <span>Focus Target (25m)</span>
          </button>
          
          <button
            onClick={() => triggerSwitchSession('break')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              sessionType === 'break'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coffee size={13} />
            <span>Short Break (5m)</span>
          </button>
        </div>

        {/* 🕒 THE COUNTDOWN WHEEL RING (PURPLE GRADIENT SPECIFIED) */}
        <div className="relative w-60 h-60 flex items-center justify-center mb-6" id="interactive-pomodoro-wheel">
          {/* Custom Ambient Glow Overlay under the circle to convey premium feeling */}
          <div className={`absolute w-48 h-48 rounded-full filter blur-xl opacity-15 transition-all duration-700 ${
            isRunning 
              ? sessionType === 'focus' ? 'bg-violet-500 scale-105' : 'bg-fuchsia-500 scale-105'
              : 'bg-slate-300'
          }`} />

          {/* SVG Progress Circle Ring */}
          <svg className="w-full h-full transform -rotate-90 absolute top-0 left-0">
            <defs>
              <linearGradient id="purpleRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" /> {/* violet-500 */}
                <stop offset="50%" stopColor="#6366f1" /> {/* indigo-500 */}
                <stop offset="100%" stopColor="#d946ef" /> {/* fuchsia-500 */}
              </linearGradient>
            </defs>

            {/* Backplate Ring */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              className="stroke-slate-100 fill-transparent"
              strokeWidth="10"
            />

            {/* Premium Gradient Active Ring */}
            <motion.circle
              cx="120"
              cy="120"
              r={radius}
              className="fill-transparent stroke-linecap-round"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * radius}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.15, ease: 'linear' }}
              style={{
                stroke: "url(#purpleRingGrad)"
              }}
            />
          </svg>

          {/* Central Digital Time overlay */}
          <div className="flex flex-col items-center justify-center z-10">
            <motion.span
              key={`${sessionType}-${timeLeft}`}
              initial={false}
              className="text-[48px] font-black font-mono tracking-tighter text-slate-800 leading-none select-none"
            >
              {formatDigitalTime(timeLeft)}
            </motion.span>
            
            <span className="text-[9px] mt-2 font-bold tracking-widest text-slate-400 uppercase font-mono flex items-center gap-1">
              <span>{sessionType === 'focus' ? 'Immersive Focus' : 'Mindful Break'}</span>
              <span>•</span>
              <span className={isRunning ? "text-indigo-600 font-extrabold animate-pulse" : ""}>
                {isRunning ? "Running" : "Paused"}
              </span>
            </span>
          </div>
        </div>

        {/* 🎛️ CONTROLS BAR: Play, Pause, Reset, Skip Break */}
        <div className="flex items-center justify-center gap-4.5 w-full max-w-xs mb-3" id="pomodoro-essential-controls">
          {/* Reset Action */}
          <button
            onClick={resetPomodoro}
            className="p-3.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-tiny"
            title="Reset timer"
          >
            <RotateCcw size={16} strokeWidth={2.5} />
          </button>

          {/* Core Start/Pause toggle trigger */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-full font-bold text-sm text-white shadow-md hover:scale-105 active:scale-95 transition-all select-none cursor-pointer flex items-center gap-2 ${
              sessionType === 'focus'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 ring-4 ring-indigo-50/70'
                : 'bg-gradient-to-r from-fuchsia-600 to-purple-650 hover:opacity-95 ring-4 ring-fuchsia-50/70'
            }`}
            id="pomodoro-toggle-stream-btn"
          >
            {isRunning ? (
              <>
                <Pause size={16} className="fill-current" strokeWidth={2.5} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={16} className="fill-current" strokeWidth={2.5} />
                <span>Start</span>
              </>
            )}
          </button>

          {/* Contextual Skip button (Skips Active Break or Session) */}
          <button
            onClick={skipActiveSession}
            className="p-3.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer shadow-tiny"
            title={sessionType === 'break' ? "Skip Break" : "Skip Focus"}
            id="pomodoro-skip-forward-btn"
          >
            <SkipForward size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Dynamic Contextual Action Information label */}
        {sessionType === 'break' && (
          <motion.button
            onClick={() => triggerSwitchSession('focus')}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 pr-1 cursor-pointer underline uppercase tracking-wider mt-1.5"
            id="pomodoro-forced-skip-break-trigger"
          >
            <span>Skip break & proceed to work session</span>
            <ChevronRight size={11} />
          </motion.button>
        )}

        {/* 🔗 Focus Target Todo Link Widget */}
        <div className="w-full mt-6 pt-5 border-t border-slate-100 text-left">
          <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-2 flex items-center gap-1.5 select-none">
            <ListTodo size={11} className="text-violet-600" /> Associate Focus Target Task
          </label>
          <select
            value={selectedTodoId}
            onChange={(e) => setSelectedTodoId(e.target.value)}
            id="pomodoro-target-todo-selection"
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 outline-none transition-all font-semibold"
          >
            <option value="">-- Sandbox Solo Focus (No linked task) --</option>
            {incompleteTodos.map(todo => (
              <option key={todo.id} value={todo.id}>
                [{todo.folder || todo.category || 'General'}] {todo.title}
              </option>
            ))}
          </select>

          {selectedTodoId && (
            <div className="mt-2 text-[10px] text-indigo-600 font-semibold flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-violet-500 animate-ping" />
              <span>Progress will be appended to this task when the focal timer completes list.</span>
            </div>
          )}
        </div>
      </div>

      {/* 🍅 SESSION VISUAL COMPLETION INDICATORS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-tiny flex flex-col gap-3.5">
        <div className="flex justify-between items-center text-left">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
              Focal Session Checklist
            </h3>
            <p className="text-[10px] text-slate-400 font-medium font-sans mt-0.5">
              Target checklist: complete 4 Pomodoro sessions (100 mins total) daily
            </p>
          </div>
          <Award size={14} className="text-amber-500" />
        </div>

        {/* List of 4 daily milestone checkpoint bulbs */}
        <div className="grid grid-cols-4 gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/60">
          {[1, 2, 3, 4].map((bulbNumber) => {
            const completedCount = getTodayCompletedCount();
            const isCompleted = completedCount >= bulbNumber;
            const isCurrent = completedCount === bulbNumber - 1 && isRunning;

            return (
              <div
                key={bulbNumber}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-violet-50 border-violet-200 text-violet-600 shadow-tiny'
                    : isCurrent
                    ? 'bg-slate-100/80 border-indigo-200 text-slate-400 animate-pulse'
                    : 'bg-white border-slate-100 text-slate-350'
                }`}
              >
                <div className="text-sm select-none">
                  {isCompleted ? '🔥' : '⏳'}
                </div>
                <span className="text-[9px] font-bold font-mono tracking-tight uppercase leading-none mt-1.5">
                  Block {bulbNumber}
                </span>
                <span className="text-[8px] font-semibold text-slate-400 mt-0.5">
                  {isCompleted ? 'Perfect' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📊 DAILY FOCUS STATISTICS (BAR CHART) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-tiny flex flex-col gap-4">
        <div className="flex justify-between items-center text-left">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight font-display">Daily Focus statistics</h3>
            <p className="text-[10px] text-slate-400 font-semibold font-sans">Visual aggregate of deep focus minutes</p>
          </div>
          <Activity size={15} className="text-violet-500" />
        </div>

        {/* Handcrafted precise, high-fidelity responsive SVG/CSS bar chart */}
        <div className="grid grid-cols-7 gap-1 px-1 mt-1" id="pomodoro-weekly-aggregate-chart">
          {past7DaysData.map((d) => {
            const isToday = d.dateStr === todayStr;
            const computedHeightPercent = maxDayMinutes > 0 ? (d.mins / maxDayMinutes) * 100 : 0;

            return (
              <div key={d.dateStr} className="flex flex-col items-center gap-1.5 py-1">
                {/* Column block */}
                <div className="w-2.5 h-20 bg-slate-100 rounded-full flex flex-col justify-end overflow-hidden">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${computedHeightPercent}%` }}
                    className={`w-full rounded-full ${
                      isToday 
                        ? 'bg-gradient-to-t from-violet-600 to-fuchsia-600 font-bold' 
                        : 'bg-gradient-to-t from-indigo-400 via-indigo-500 to-violet-500 font-medium'
                    }`}
                  />
                </div>

                {/* Digital Labels */}
                <span className="text-[9px] font-black text-slate-700 font-mono leading-none">
                  {d.mins}m
                </span>

                {/* Day indicator */}
                <span className={`text-[8px] uppercase tracking-wider font-mono font-bold py-0.5 px-1 rounded ${
                  isToday 
                    ? 'bg-violet-600 text-white font-extrabold' 
                    : 'text-slate-400'
                }`}>
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 💡 STUNNING CHOSEN INSIGHTFUL QUOTES PANEL */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-3xl p-5 text-left relative overflow-hidden" id="pomodoro-inspirational-deck">
        <div className="absolute right-2 -bottom-2 text-purple-200/50 opacity-15">
          <MessageSquare size={65} />
        </div>

        <div className="flex justify-between items-center mb-2.5 relative z-10">
          <div className="flex items-center gap-1 text-purple-700 text-[10px] font-mono tracking-widest uppercase font-bold">
            <Sparkle size={10} className="text-purple-600 animate-spin" />
            <span>MINDSETS FOR CONCENTRATION</span>
          </div>

          <button
            onClick={shuffleQuote}
            className="p-1.5 rounded-lg bg-white/60 hover:bg-white text-purple-600 border border-purple-100 transition-all cursor-pointer hover:scale-105"
            title="Refresh quote"
            id="btn-shuffle-premium-quote"
          >
            <RefreshCw size={11} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIndex}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ duration: 0.18 }}
            className="relative z-10"
          >
            <p className="text-xs font-semibold font-serif italic text-slate-700 leading-relaxed">
              "{selectedQuote.text}"
            </p>
            <p className="text-[10px] font-bold text-indigo-600 font-mono tracking-tight mt-1 ml-0.5">
              — {selectedQuote.author}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 🔮 ULTRA-PREMIUM PROC FOCUS MUSIC STREAM ENGINE */}
      <FocusMusicWidget />

      {/* 🛎️ PRESETS & AUDIO FEEDBACK BENCH */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-tiny flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
            <span>Audio & Alert feedback</span>
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          {/* Zen Bell sound */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-violet-50/50 border-violet-200/80 text-violet-700 font-bold'
                : 'bg-transparent border-slate-100 text-slate-400 font-medium'
            }`}
            id="control-bell-synth"
          >
            <Volume2 size={15} />
            <span className="text-[10px]">Zen Chime Chord</span>
          </button>

          {/* Clock Ticking feel */}
          <button
            type="button"
            onClick={toggleTick}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
              tickSoundEnabled
                ? 'bg-violet-50/50 border-violet-200/80 text-violet-700 font-bold'
                : 'bg-transparent border-slate-100 text-slate-400 font-medium'
            }`}
            id="control-haptic-tick"
          >
            <Clock size={15} />
            <span className="text-[10px]">Haptic Soft Ticking</span>
          </button>
        </div>
      </div>

      {/* 🏆 STUNNING ALARM POPUP TRIGGER */}
      <AnimatePresence>
        {popupAlert && popupAlert.show && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full border border-purple-100 text-center relative"
              id="pomodoro-completion-toast-panel"
            >
              <button
                onClick={() => setPopupAlert(null)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>

              <div className="w-14 h-14 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4 text-xl">
                🔮
              </div>

              <h3 className="text-sm font-black text-slate-800 tracking-tight font-display mb-1.5 leading-tight">
                {popupAlert.label}
              </h3>
              
              <p className="text-xs text-slate-500 leading-relaxed mb-5 px-1 font-medium">
                {popupAlert.msg}
              </p>

              <button
                onClick={() => setPopupAlert(null)}
                className="w-full py-2.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 shadow-sm transition-all cursor-pointer"
              >
                Acknowledge Flow
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
