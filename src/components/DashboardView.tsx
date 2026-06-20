import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Calendar, 
  Trash2,
  Clock, 
  Bell, 
  Flame, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Sliders,
  Notebook,
  Hourglass
} from 'lucide-react';
import { Todo, UserProfile, Habit, Note } from '../types';
import DailyMotivationWidget from './DailyMotivationWidget';
import CompactStatsWidget from './CompactStatsWidget';

interface DashboardViewProps {
  todos: Todo[];
  onToggleTodo: (id: string) => void;
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  onUpdateTodo: (id: string, updatedFields: Partial<Todo>) => void;
  onDeleteTodo: (id: string) => void;
  accentColor: string;
  dailyGoal: number;
  setActiveTab?: (tab: 'dashboard' | 'habits' | 'timer' | 'calendar' | 'stats' | 'notes' | 'settings' | 'profile') => void;
  onAddNote?: (note: Omit<Note, 'id' | 'createdAt'>) => void;
}

interface CompletedSession {
  id: string;
  name: string;
  minutes: number;
  completedAt: string;
  type: 'focus' | 'break';
}

const CATEGORIES = [
  { name: 'Work', icon: '💼', colorClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  { name: 'Personal', icon: '🏠', colorClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { name: 'Wellness', icon: '🧘', colorClass: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300' },
  { name: 'Shopping', icon: '🛒', colorClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  { name: 'Urgent', icon: '🔥', colorClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
];

interface QuickActionButtonProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  isDarkMode: boolean;
  onClick: () => void;
  doubleWidth?: boolean;
}

function QuickActionButton({
  title,
  subtitle,
  icon,
  gradient,
  isDarkMode,
  onClick,
  doubleWidth = false
}: QuickActionButtonProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y
    };
    
    setRipples((prev) => [...prev, newRipple]);
  };

  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onClick={() => {
        onClick();
      }}
      className={`quick-action-card relative group overflow-hidden p-3 border text-left flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xs active:scale-[0.98] cursor-pointer select-none ${
        doubleWidth ? 'col-span-2 max-[390.9px]:col-span-1' : ''
      } ${
        isDarkMode 
          ? 'bg-slate-900/40 border-slate-800/60 hover:border-[#6C3BFF]/45 hover:bg-slate-900/60 shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-md' 
          : 'bg-white/45 backdrop-blur-md border-slate-200/50 hover:border-[#6C3BFF]/35 hover:bg-white/70 shadow-[0_4px_20px_rgba(108,59,255,0.02)]'
      }`}
    >
      {/* Framer Motion Ripple Overlay */}
      <span className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.35 }}
              animate={{ scale: 6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute bg-violet-500/25 dark:bg-violet-400/20 rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: '16px',
                height: '16px',
                marginLeft: '-8px',
                marginTop: '-8px',
              }}
            />
          ))}
        </AnimatePresence>
      </span>

      {/* 48x48 icon with gradient icon background */}
      <div 
        className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center bg-gradient-to-tr ${gradient} text-white shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 relative z-10`}
      >
        <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {icon}
      </div>

      <div className="flex flex-col justify-center relative z-10">
        <span className="text-xs font-bold tracking-tight text-slate-800 dark:text-slate-100 font-sans">
          {title}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-450 font-medium tracking-wide mt-0.5">
          {subtitle}
        </span>
      </div>
    </button>
  );
}

export default function DashboardView({
  todos,
  onToggleTodo,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  accentColor,
  dailyGoal,
  setActiveTab,
  onAddNote
}: DashboardViewProps) {
  // Global States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('premium_dark_mode') === 'true';
  });
  
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newFolder, setNewFolder] = useState('');

  // Stores
  const [habitsStore, setHabitsStore] = useState<Habit[]>([]);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [profileStore, setProfileStore] = useState<UserProfile | null>(null);

  // Load complementary data
  useEffect(() => {
    const storedHabits = localStorage.getItem('premium_habits_store');
    if (storedHabits) {
      try { setHabitsStore(JSON.parse(storedHabits)); } catch (e) {}
    }
    
    const storedSessions = localStorage.getItem('completed_focus_sessions');
    if (storedSessions) {
      try { setCompletedSessions(JSON.parse(storedSessions)); } catch (e) {}
    }

    const storedProfile = localStorage.getItem('organizer_profile');
    if (storedProfile) {
      try { setProfileStore(JSON.parse(storedProfile)); } catch (e) {}
    }
  }, [todos]);

  // Dark Mode Sync
  useEffect(() => {
    localStorage.setItem('premium_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today static identifier
  const todayStr = '2026-06-19';

  // Greeting based on time
  const greetingText = useMemo(() => {
    const hours = currentTime.getHours();
    const userDisplayName = profileStore?.name || 'Prince Kumar';
    if (hours < 12) return `Good Morning, ${userDisplayName} 👋`;
    if (hours < 17) return `Good Afternoon, ${userDisplayName} 👋`;
    return `Good Evening, ${userDisplayName} 👋`;
  }, [currentTime, profileStore]);

  // Date formatted elegantly
  const formattedDateString = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, [currentTime]);

  // Sync Calculations
  const completedTodayCount = useMemo(() => {
    return todos.filter(t => t.completed && (!t.dueDate || t.dueDate === todayStr)).length;
  }, [todos]);

  const totalTodayTasks = useMemo(() => {
    return todos.length;
  }, [todos]);

  const focusMinutesToday = useMemo(() => {
    return completedSessions
      .filter(s => s.completedAt.split('T')[0] === todayStr && s.type === 'focus')
      .reduce((sum, curr) => sum + curr.minutes, 0);
  }, [completedSessions]);

  const completedHabitsTodayCount = useMemo(() => {
    return habitsStore.filter(h => h.history?.[todayStr] === true).length;
  }, [habitsStore]);

  const totalActiveHabitsCount = habitsStore.length || 1;

  const habitCompletionRate = useMemo(() => {
    return habitsStore.length > 0 
      ? Math.round((completedHabitsTodayCount / habitsStore.length) * 100) 
      : 0;
  }, [habitsStore, completedHabitsTodayCount]);

  const maxActiveHabitStreak = useMemo(() => {
    if (habitsStore.length === 0) return 0;
    return Math.max(...habitsStore.map(h => h.streak), 0);
  }, [habitsStore]);

  // Productivity Score Calculation
  const dailyWorkloadScore = useMemo(() => {
    const taskRate = totalTodayTasks > 0 ? (completedTodayCount / totalTodayTasks) : 1.0;
    const habitRate = habitsStore.length > 0 ? (completedHabitsTodayCount / habitsStore.length) : 1.0;
    const focusContribution = Math.min(focusMinutesToday / 60, 1.0); // 60 mins yields full focus percent
    
    // Weighted Index: 40% tasks, 40% habits, 20% focus time
    const weightedSum = (taskRate * 40) + (habitRate * 40) + (focusContribution * 20);
    return Math.min(Math.round(weightedSum), 100);
  }, [totalTodayTasks, completedTodayCount, habitsStore, completedHabitsTodayCount, focusMinutesToday]);

  // Top 3 active tasks sorted
  const topThreeTasks = useMemo(() => {
    return todos
      .filter(t => !t.completed)
      .slice(0, 3);
  }, [todos]);

  // Form Submit Action
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTodo({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      completed: false,
      category: newCategory,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      time: newTime.trim() || undefined,
      folder: newFolder.trim() || undefined,
      subtasks: []
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Personal');
    setNewPriority('medium');
    setNewDueDate('');
    setNewTime('');
    setNewFolder('');
    setIsAddOpen(false);
  };

  return (
    <div 
      className={`min-h-screen font-sans transition-all duration-300 pb-24 ${
        isDarkMode 
          ? 'bg-[#0B0F19] text-slate-100' 
          : 'bg-[#F8F9FC] text-slate-800'
      }`}
      id="minimal-productivity-dashboard"
    >
      {/* 🛎️ HEADER */}
      <header className="max-w-4xl mx-auto px-6 pt-5 pb-3 flex justify-between items-start">
        <div className="text-left flex flex-col gap-1 min-w-0">
          <p className={`text-xs font-semibold tracking-wider uppercase ${isDarkMode ? 'text-violet-400' : 'text-[#6C3BFF]'}`}>
            Workspace
          </p>
          <h1 className="text-2xl sm:text-[32px] font-bold tracking-tight text-slate-900 dark:text-white leading-snug whitespace-normal">
            {currentTime.getHours() < 12 ? 'Good Morning,' : currentTime.getHours() < 17 ? 'Good Afternoon,' : 'Good Evening,'}
            <span className="block mt-0.5 text-xl sm:text-[30px] text-[#6C3BFF] dark:text-violet-300 font-black">
              {profileStore?.name || 'Prince Kumar'} 👋
            </span>
          </h1>
          <div className="mt-1 flex items-center">
            <span className="inline-flex items-center px-3.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-base font-medium text-slate-650 dark:text-slate-300 whitespace-nowrap transition-colors">
              {formattedDateString}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 mt-1 shrink-0">
          {/* Theme Shift */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-yellow-405 hover:bg-slate-800' 
                : 'bg-white border-slate-200/60 text-slate-605 hover:bg-slate-100 shadow-3xs'
            }`}
            title="Toggle space theme"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          {/* Interactive Bell dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' 
                  : 'bg-white border-slate-200/60 text-slate-605 hover:bg-slate-100 shadow-3xs'
              }`}
            >
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#6C3BFF] rounded-full animate-pulse" />
            </button>

            {/* Dropdown Card */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 mt-3 w-72 rounded-[24px] shadow-lg border p-4 z-40 text-xs text-left ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-705'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-dashed border-slate-200/50 dark:border-slate-800">
                    <span className="font-bold">System Insights</span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="p-2 rounded-xl bg-violet-500/5 border border-violet-500/10 flex gap-2">
                      <span>✓</span>
                      <div>
                        <p className="font-bold">System operational</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Your local database synced successfully.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Bento Layout Container */}
      <main className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
        
        {/* 🏆 HERO CARD (col-span-12) */}
        <section className="md:col-span-12">
          <div className={`p-6 rounded-[24px] border relative overflow-hidden transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-tr from-slate-900/90 to-slate-950/90 border-slate-800/80 shadow-md' 
              : 'bg-white border-slate-200/50 shadow-xs'
          }`}>
            {/* Soft decorative background glow */}
            <div className="absolute right-0 top-0 w-48 h-48 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              
              {/* Productive readouts */}
              <div className="text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider mb-3 bg-violet-500/10 text-[#6C3BFF] dark:text-violet-300">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Performance Index
                </div>
                <h2 className="text-xl font-bold tracking-tight">Today's Focus Synergy</h2>
                <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Your overall productivity score is calculated in real-time from completed habits, focus sessions, and checked items.
                </p>

                {/* Horizontal metric counters */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                    <p className={`text-[10px] font-semibold tracking-wider uppercase font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Completed</p>
                    <p className="text-lg font-black tracking-tight mt-1 font-mono">
                      {completedTodayCount} <span className="text-xs text-slate-400">/ {totalTodayTasks}</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                    <p className={`text-[10px] font-semibold tracking-wider uppercase font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Focus Time</p>
                    <p className="text-lg font-black tracking-tight mt-1 font-mono">
                      {focusMinutesToday} <span className="text-xs text-slate-400">m</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                    <p className={`text-[10px] font-semibold tracking-wider uppercase font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ritual Streak</p>
                    <p className="text-lg font-black tracking-tight mt-1 font-mono">
                      {maxActiveHabitStreak} <span className="text-xs text-slate-400">d</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Circular Score element */}
              <div className="flex items-center justify-center shrink-0 pr-2">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Outer Ring template */}
                    <circle
                      cx="64"
                      cy="64"
                      r="50"
                      className={`${isDarkMode ? 'stroke-slate-800' : 'stroke-slate-100'} fill-transparent`}
                      strokeWidth="8"
                    />
                    {/* Ring score */}
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="50"
                      className="stroke-[#6C3BFF] fill-transparent stroke-linecap-round"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 50}
                      initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                      animate={{ strokeDashoffset: (2 * Math.PI * 50) * (1 - dailyWorkloadScore / 100) }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  
                  {/* Readout */}
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black font-mono leading-none tracking-tight">{dailyWorkloadScore}%</span>
                    <span className={`text-[8px] uppercase tracking-widest font-bold mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-505'}`}>
                      Score
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 📊 COMPACT STATS WIDGET (Single premium glass card) */}
        <section className="md:col-span-12">
          <CompactStatsWidget isDarkMode={isDarkMode} />
        </section>

        {/* 📅 TODAY'S TASKS (col-span-7) */}
        <section className="md:col-span-7 flex flex-col gap-3">
          <div className={`p-5 rounded-[24px] border text-left flex flex-col flex-1 ${
            isDarkMode 
              ? 'bg-slate-900/40 border-slate-800/60 shadow-xs' 
              : 'bg-white border-slate-200/50 shadow-3xs'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold tracking-tight">Today's Tasks</h3>
              <button
                onClick={() => setActiveTab?.('calendar')}
                className="text-xs font-bold text-[#6C3BFF] hover:underline flex items-center gap-0.5"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>

            {/* Tasks list */}
            <div className="flex flex-col gap-2.5 flex-1 justify-start">
              {topThreeTasks.length > 0 ? (
                topThreeTasks.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950/60 border-slate-800/60 hover:border-violet-800/40' 
                        : 'bg-slate-50/10 border-slate-200/50 hover:border-violet-100 shadow-3xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => onToggleTodo(todo.id)}
                        className="text-slate-400 hover:text-[#6C3BFF] cursor-pointer shrink-0 transition-colors"
                      >
                        <Circle size={16} strokeWidth={2} />
                      </button>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold text-slate-800 dark:text-slate-100 truncate transition-all duration-300 ${
                          localStorage.getItem('privacy_shield_enabled') === 'true'
                            ? 'blur-[3px] hover:blur-none select-none cursor-help'
                            : ''
                        }`} title={localStorage.getItem('privacy_shield_enabled') === 'true' ? "Hover to view cloaked task" : ""}>
                          {todo.title}
                        </p>
                        {todo.category && (
                          <span className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 bg-violet-50 dark:bg-violet-950/20 text-[#6C3BFF] dark:text-violet-300">
                            {todo.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteTodo(todo.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-lg shrink-0 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs italic flex flex-col items-center justify-center gap-2">
                  <p>✨ Clear focus slate! No pending tasks remaining.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 🌸 HABIT SUMMARY & ACTIONS (col-span-5) */}
        <section className="md:col-span-5 flex flex-col gap-4">
          
          {/* HABIT SUMMARY COLUMN */}
          <div className={`p-5 rounded-[24px] border text-left ${
            isDarkMode 
              ? 'bg-slate-900/40 border-slate-800/60 shadow-xs' 
              : 'bg-white border-slate-200/50 shadow-3xs'
          }`}>
            <h3 className="text-sm font-bold tracking-tight mb-3">Habit Summary</h3>
            
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200/50 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Current Streak</span>
                <p className="text-xl font-black mt-0.5 font-mono">{maxActiveHabitStreak} Days</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Completion</span>
                <p className="text-xl font-black mt-0.5 font-mono">{habitCompletionRate}%</p>
              </div>
            </div>

            {/* Small active horizontal progress bar */}
            <div className="mt-3.5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-violet-600 to-[#6C3BFF] h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${habitCompletionRate}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                Keep going! Streaks update immediately as habits are cleared.
              </p>
            </div>
          </div>

          {/* QUICK ACTIONS BAR */}
          <div className={`p-5 rounded-[28px] border text-left relative overflow-hidden backdrop-blur-md ${
            isDarkMode 
              ? 'bg-slate-900/25 border-slate-800/50 shadow-lg' 
              : 'bg-white/30 border-slate-200/40 shadow-sm'
          }`} id="quick-actions-glass-card">
            
            {/* Subtle background glow effect */}
            <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest font-sans">
                Quick Actions
              </h3>
              <span className="w-1.5 h-1.5 rounded-full bg-[#6C3BFF] animate-pulse" />
            </div>

            <div className="quick-actions-bar relative z-10">
              
              <QuickActionButton
                title="Add Task"
                subtitle="Commit a clean target intent"
                icon={<Plus size={20} className="stroke-[2.8px]" />}
                gradient="from-violet-500 via-[#6C3BFF] to-indigo-600"
                isDarkMode={isDarkMode}
                onClick={() => setIsAddOpen(true)}
                doubleWidth={true}
              />

              <QuickActionButton
                title="Start Habit"
                subtitle="Clear routine hot streak"
                icon={<Flame size={20} />}
                gradient="from-rose-500 via-pink-550 to-amber-500"
                isDarkMode={isDarkMode}
                onClick={() => setActiveTab?.('habits')}
              />

              <QuickActionButton
                title="Focus Block"
                subtitle="Deep immersive timer slots"
                icon={<Hourglass size={18} />}
                gradient="from-fuchsia-600 via-purple-550 to-[#6C3BFF]"
                isDarkMode={isDarkMode}
                onClick={() => setActiveTab?.('timer')}
              />

              <QuickActionButton
                title="Planner Agenda"
                subtitle="Schedule calendar details"
                icon={<Calendar size={18} />}
                gradient="from-blue-500 via-indigo-500 to-cyan-500"
                isDarkMode={isDarkMode}
                onClick={() => setActiveTab?.('calendar')}
              />

              <QuickActionButton
                title="Personal Memo"
                subtitle="Write smart notes & drafts"
                icon={<Notebook size={18} />}
                gradient="from-emerald-500 via-teal-555 to-emerald-600"
                isDarkMode={isDarkMode}
                onClick={() => setActiveTab?.('notes')}
              />

            </div>
          </div>

          {/* 🌟 DAILY ZEN MOTIVATION INTEGRATED CARD */}
          <DailyMotivationWidget />

        </section>

      </main>

      {/* 🚀 FLOATING BUTTON */}
      <div className="fixed bottom-24 right-6 sm:bottom-6 sm:right-6 z-40">
        <div className="relative group">
          {/* Subtle back glowing accent */}
          <span className="absolute inset-x-0 bottom-0 bg-[#6C3BFF] rounded-full w-full h-full scale-110 blur-md opacity-25" />
          
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 via-[#6C3BFF] to-fuchsia-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            id="minimal-quick-task-fab"
            title="Add a new task objective"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 📌 NEW TASK DIALOG POPUP */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
            <motion.div 
              className="absolute inset-0 bg-transparent cursor-pointer" 
              onClick={() => setIsAddOpen(false)} 
            />

            <motion.div 
              id="new-todo-modal"
              initial={{ y: '100%', opacity: 0.9 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`relative w-full max-w-md rounded-t-3xl sm:rounded-[24px] shadow-xl overflow-hidden overflow-y-auto max-h-[85vh] z-10 border ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="px-5 pb-6 pt-6 text-left">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-bold tracking-tight">New Target Objective</h3>
                  <button 
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="p-1.5 rounded-full bg-slate-50 dark:bg-slate-850 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Task Title */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Brainstorm marketing layouts"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/20 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-202' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                      Description
                    </label>
                    <textarea
                      placeholder="Add auxiliary descriptions..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={2}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/20 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-202' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Horizontal Category Pill selector */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                      Category Segment
                    </label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setNewCategory(cat.name)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-all ${
                            newCategory === cat.name
                              ? 'bg-[#6C3BFF] border-transparent text-white'
                              : isDarkMode 
                                ? 'bg-slate-955 border-slate-800 hover:bg-slate-800 text-slate-400' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-650'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority and List Folder */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                        Priority Level
                      </label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/20 ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-202' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                        Folder List
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Work backlog"
                        value={newFolder}
                        onChange={(e) => setNewFolder(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/20 ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-202' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Timing details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/20 ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-202' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                        Due Hour / Time
                      </label>
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/20 ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-202' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mt-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddOpen(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isDarkMode ? 'bg-slate-800 hover:bg-slate-750' : 'bg-slate-100 hover:bg-slate-150'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-tr from-violet-600 to-[#6C3BFF] text-white font-bold text-xs shadow-md shadow-violet-500/10 hover:brightness-105 active:scale-95"
                    >
                      Save Objective
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
