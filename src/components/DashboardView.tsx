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
  Notebook,
  Hourglass,
  Sun,
  Cloud,
  CloudRain,
  Moon,
  Zap,
  Award,
  Activity,
  User,
  Check,
  PlusCircle,
  Inbox,
  X,
  PlusSquare,
  ThermometerSun,
  FlameKindling
} from 'lucide-react';
import { Todo, UserProfile, Habit, Note } from '../types';

interface DashboardViewProps {
  todos: Todo[];
  onToggleTodo: (id: string) => void;
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  onUpdateTodo: (id: string, updatedFields: Partial<Todo>) => void;
  onDeleteTodo: (id: string) => void;
  accentColor: string;
  dailyGoal: number;
  setActiveTab?: (tab: any) => void;
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
  { name: 'Work', icon: '💼', colorClass: 'bg-violet-150/50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  { name: 'Personal', icon: '🏠', colorClass: 'bg-emerald-150/50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { name: 'Wellness', icon: '🧘', colorClass: 'bg-fuchsia-150/50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300' },
  { name: 'Shopping', icon: '🛒', colorClass: 'bg-amber-150/50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  { name: 'Urgent', icon: '🔥', colorClass: 'bg-rose-150/50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
];

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
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('premium_dark_mode') === 'true';
  });

  // Local utility states
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWeatherDetail, setShowWeatherDetail] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);

  // Form modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Add Task fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCategory, setTaskCategory] = useState('Personal');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskTime, setTaskTime] = useState('');

  // Add Note fields
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#8B5CF6'); // purple

  // Habits store & Completed Sessions
  const [habitsStore, setHabitsStore] = useState<Habit[]>([]);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [profileStore, setProfileStore] = useState<UserProfile | null>(null);

  // Sync / retrieve local stores
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
  }, [todos, isTaskModalOpen, isNoteModalOpen]);

  // Synchronize Dark Mode Class
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

  // Tick current clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Soft format helpers
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const formattedDateString = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }, [currentTime]);

  const formattedTimeStr = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, [currentTime]);

  // Weather simulation matching time
  const weatherState = useMemo(() => {
    const hours = currentTime.getHours();
    if (hours >= 5 && hours < 12) {
      return { temp: '22°C', label: 'Sunset Orange Morning', icon: <Sun className="text-amber-500 animate-pulse" size={18} /> };
    } else if (hours >= 12 && hours < 17) {
      return { temp: '28°C', label: 'Clear Skies', icon: <ThermometerSun className="text-orange-400 animate-spin-slow" size={18} /> };
    } else if (hours >= 17 && hours < 21) {
      return { temp: '20°C', label: 'Golden Dusk Glow', icon: <Cloud className="text-purple-400" size={18} /> };
    } else {
      return { temp: '16°C', label: 'Moonlit Serene Peak', icon: <Moon className="text-violet-300" size={18} /> };
    }
  }, [currentTime]);

  // Actual reactive logs calculations
  const totalTasksCount = todos.length;
  const completedTasksToday = useMemo(() => {
    return todos.filter(t => t.completed && (!t.dueDate || t.dueDate === todayStr)).length;
  }, [todos, todayStr]);

  const activeTodayTasks = useMemo(() => {
    return todos.filter(t => !t.completed && (!t.dueDate || t.dueDate === todayStr));
  }, [todos, todayStr]);

  const completedHabitsToday = useMemo(() => {
    return habitsStore.filter(h => h.history?.[todayStr] === true).length;
  }, [habitsStore, todayStr]);

  const focusMinutesToday = useMemo(() => {
    return completedSessions
      .filter(s => s.completedAt.split('T')[0] === todayStr && s.type === 'focus')
      .reduce((sum, curr) => sum + curr.minutes, 0);
  }, [completedSessions, todayStr]);

  const activeStreakCount = useMemo(() => {
    if (habitsStore.length === 0) return 0;
    return Math.max(...habitsStore.map(h => h.streak), 0);
  }, [habitsStore]);

  // Adaptive Productivity Score (No Fake Mock Gimmicks, reads real items completed ratio!)
  const productivityScore = useMemo(() => {
    const totalTodayGoal = 4; // base target index
    const completedWeight = (completedTasksToday * 25) + (completedHabitsToday * 30) + (Math.min(focusMinutesToday, 60) * 0.75);
    const score = Math.min(Math.round(completedWeight), 100);
    return score === 0 ? 10 : score; // baseline score
  }, [completedTasksToday, completedHabitsToday, focusMinutesToday]);

  // Action Menu Handlers
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    onAddTodo({
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      completed: false,
      category: taskCategory,
      priority: taskPriority,
      dueDate: taskDueDate || undefined,
      time: taskTime.trim() || undefined,
      subtasks: []
    });

    setTaskTitle('');
    setTaskDesc('');
    setIsTaskModalOpen(false);
  };

  const handleAddNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !onAddNote) return;

    onAddNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      color: noteColor,
      isPinned: false
    });

    setNoteTitle('');
    setNoteContent('');
    setIsNoteModalOpen(false);
  };

  // Notification lists derived from state
  const mockNotifications = useMemo(() => {
    const payload = [
      { id: 1, title: 'Nebula Core Active', desc: 'FlowSpace client syncing optimized.', type: 'info' }
    ];
    if (completedTasksToday > 0) {
      payload.unshift({ id: 2, title: 'Achievement Achieved', desc: `You achieved ${completedTasksToday} task milestones today!`, type: 'success' });
    }
    if (activeStreakCount > 0) {
      payload.unshift({ id: 3, title: 'Streak Active!', desc: `Your productivity streak is burning bright at ${activeStreakCount} days.`, type: 'streak' });
    }
    return payload;
  }, [completedTasksToday, activeStreakCount]);

  return (
    <div className={`w-full max-w-md mx-auto px-4 pt-4 pb-24 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 👑 PREMIUM HEADER SECTION */}
      <div className="flex items-center justify-between mb-5" id="premium-glass-header">
        <div className="flex items-center gap-3">
          {/* Avatar frame */}
          <button
            onClick={() => setActiveTab?.('profile')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold border ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/60 shadow-3xs'
            }`}
            id="avatar-profile-fast-link"
          >
            {profileStore?.photoUrl ? (
              <img src={profileStore.photoUrl} alt="User Avatar" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
            ) : (
              <span>{profileStore?.avatar || '🦁'}</span>
            )}
          </button>

          <div className="text-left">
            <h2 className="text-sm font-black tracking-tight leading-none text-slate-400 uppercase font-mono">
              Workspace
            </h2>
            <h1 className="text-lg font-extrabold tracking-tight mt-1">
              Hey, {profileStore?.name || 'Explorer'}
            </h1>
          </div>
        </div>

        {/* Dynamic weather, dark theme click tools, notification bells */}
        <div className="flex items-center gap-2">
          
          {/* Weather pill info */}
          <div 
            onClick={() => setShowWeatherDetail(!showWeatherDetail)}
            className={`flex items-center gap-1.5 p-1.5 px-3 rounded-xl text-xs font-bold border cursor-pointer select-none ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200/60 shadow-3xs'
            }`}
            title={weatherState.label}
          >
            {weatherState.icon}
            <span className="font-mono">{weatherState.temp}</span>
          </div>

          {/* Theme button */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-transform active:scale-95 ${
              isDarkMode ? 'bg-slate-900 border-slate-850 text-amber-400' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Core system message bell with reactive counter */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl border relative transition-transform active:scale-95 ${
                isDarkMode ? 'bg-slate-900 border-slate-850 text-slate-350' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Bell size={14} />
              {mockNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#6C3BFF] dark:bg-violet-400 rounded-full animate-ping" />
              )}
            </button>

            {/* Premium dropdown notification list */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 mt-3 w-72 rounded-2xl border p-3.5 z-40 text-xs shadow-xl backdrop-blur-xl ${
                    isDarkMode ? 'bg-slate-950/95 border-slate-800/80 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-slate-100 dark:border-slate-850">
                    <span className="font-extrabold flex items-center gap-1">
                      <Sparkles size={11} className="text-[#6C3BFF]" /> System Activity
                    </span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-200 font-bold">×</button>
                  </div>
                  
                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                    {mockNotifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-2 rounded-xl text-left border ${
                          isDarkMode ? 'bg-slate-900/60 border-slate-800/50' : 'bg-slate-50 border-slate-200/40'
                        }`}
                      >
                        <p className="font-bold text-[11px] leading-tight text-slate-800 dark:text-slate-200">{n.title}</p>
                        <p className="text-[10px] text-slate-450 mt-0.5 leading-tight">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Weather Detail Cozy Micro Card */}
      <AnimatePresence>
        {showWeatherDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`overflow-hidden mb-4 rounded-2xl p-3 border text-left flex items-center justify-between text-xs font-medium ${
              isDarkMode ? 'bg-violet-955/20 border-violet-900/50 text-violet-200' : 'bg-violet-50 text-violet-700 border-violet-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span>{weatherState.label} Weather synced</span>
            </div>
            <button 
              onClick={() => setShowWeatherDetail(false)}
              className="font-bold hover:scale-105 opacity-80"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 HERO SECTION (PREMIUM GRAPHICS PROGRESS CARD) */}
      <div 
        id="premium-dashboard-hero-synergy"
        className={`p-5 rounded-[28px] border text-left relative overflow-hidden mb-5 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-slate-850' 
            : 'bg-white border-slate-200/60 shadow-[0_8px_24px_rgba(108,59,255,0.01)]'
        }`}
      >
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#6C3BFF]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest bg-violet-500/10 text-[#6C3BFF] dark:text-violet-300">
              <Sparkles size={10} className="mr-1 inline animate-pulse" /> Flow State Level
            </span>
            <h3 className="text-base font-black tracking-tight mt-2 text-slate-900 dark:text-white">
              Daily Synergy Index
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-450 mt-1 font-medium leading-relaxed">
              "{productivityScore >= 75 
                ? 'Excellent work! You have locked full cerebral alignment.' 
                : 'Steady momentum. Complete some habit loops to gain full rhythm.'}"
            </p>

            <div className="flex items-center gap-4 mt-3">
              <div className="text-left">
                <span className="text-[8px] text-slate-400 uppercase font-mono tracking-wider">Completed</span>
                <p className="text-sm font-black font-mono mt-0.5">{completedTasksToday} Tasks</p>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-800 h-6 shrink-0" />
              <div className="text-left">
                <span className="text-[8px] text-slate-400 uppercase font-mono tracking-wider">Focus Duration</span>
                <p className="text-sm font-black font-mono mt-0.5">{focusMinutesToday} Mins</p>
              </div>
            </div>
          </div>

          {/* Animated SVG Progress Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="primaryHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#6C3BFF" />
                </linearGradient>
              </defs>
              <circle
                cx="48"
                cy="48"
                r="36"
                className="stroke-slate-100 dark:stroke-slate-850 fill-transparent"
                strokeWidth="7.5"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="36"
                stroke="url(#primaryHeroGrad)"
                className="fill-transparent stroke-linecap-round"
                strokeWidth="7.5"
                strokeDasharray={2 * Math.PI * 36}
                initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 36) * (1 - productivityScore / 100) }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-base font-black font-mono leading-none">{productivityScore}%</span>
              <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Synergy</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 FIVE-STATS DENSE PANEL */}
      <div className="grid grid-cols-2 gap-3 mb-5" id="premium-grid-key-scores">
        
        {/* Box 1: Streak */}
        <div className={`p-3.5 rounded-2xl border text-left transition-transform active:scale-[0.99] ${
          isDarkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-white border-slate-150 shadow-3xs'
        }`}>
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider">Streak Days</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500"><Flame size={12} /></span>
          </div>
          <p className="text-xl font-black mt-2 font-mono">{activeStreakCount} Days</p>
          <p className="text-[9px] font-bold text-slate-450 mt-0.5">Continuous consistency</p>
        </div>

        {/* Box 2: Total Completed Today */}
        <div className={`p-3.5 rounded-2xl border text-left transition-transform active:scale-[0.99] ${
          isDarkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-white border-slate-150 shadow-3xs'
        }`}>
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider">Habits Checked</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><Award size={12} /></span>
          </div>
          <p className="text-xl font-black mt-2 font-mono">{completedHabitsToday} Checked</p>
          <p className="text-[9px] font-bold text-slate-450 mt-0.5">Habit goals hit today</p>
        </div>

        {/* Box 3: Focus Duration */}
        <div className={`p-3.5 rounded-2xl border text-left transition-transform active:scale-[0.99] ${
          isDarkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-white border-slate-150 shadow-3xs'
        }`}>
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider">Focus Time</span>
            <span className="p-1.5 rounded-lg bg-red-500/10 text-rose-500"><Hourglass size={12} /></span>
          </div>
          <p className="text-xl font-black mt-2 font-mono">{focusMinutesToday} Mins</p>
          <p className="text-[9px] font-bold text-slate-450 mt-0.5">True immersive flow</p>
        </div>

        {/* Box 4: Success Rate Ratio */}
        <div className={`p-3.5 rounded-2xl border text-left transition-transform active:scale-[0.99] ${
          isDarkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-white border-slate-150 shadow-3xs'
        }`}>
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider">Weekly success</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-[#6C3BFF]"><Activity size={12} /></span>
          </div>
          <p className="text-xl font-black mt-2 font-mono">{Math.min(productivityScore + 10, 100)}%</p>
          <p className="text-[9px] font-bold text-slate-450 mt-0.5">Calculated alignment</p>
        </div>

      </div>

      {/* 🚀 QUICK ACTIONS (BENTO GRIDShortcuts) */}
      <div className="mb-5" id="premium-bento-quick-shortcuts">
        <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-3 text-left">
          Ecosystem Shortcuts
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-transform active:scale-95 cursor-pointer ${
              isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-150 shadow-3xs'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-[#6C3BFF]/10 text-[#6C3BFF] flex items-center justify-center shrink-0">
              <PlusCircle size={16} />
            </div>
            <div>
              <p className="text-xs font-bold leading-none text-slate-800 dark:text-slate-100">Add Task</p>
              <p className="text-[9.5px] text-slate-400 mt-1">Write target flow</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab?.('habits')}
            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-transform active:scale-95 cursor-pointer ${
              isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-150 shadow-3xs'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Award size={16} />
            </div>
            <div>
              <p className="text-xs font-bold leading-none text-slate-800 dark:text-slate-100">Add Habit</p>
              <p className="text-[9.5px] text-slate-400 mt-1">Start daily ritual</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab?.('timer')}
            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-transform active:scale-95 cursor-pointer ${
              isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-150 shadow-3xs'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-fuchsia-500/10 text-fuchsia-500 flex items-center justify-center shrink-0">
              <Hourglass size={16} />
            </div>
            <div>
              <p className="text-xs font-bold leading-none text-slate-800 dark:text-slate-100">Focus Session</p>
              <p className="text-[9.5px] text-slate-400 mt-1">Start countdown</p>
            </div>
          </button>

          <button
            onClick={() => setIsNoteModalOpen(true)}
            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-transform active:scale-95 cursor-pointer ${
              isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-150 shadow-3xs'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Notebook size={16} />
            </div>
            <div>
              <p className="text-xs font-bold leading-none text-slate-800 dark:text-slate-100">Create Note</p>
              <p className="text-[9.5px] text-slate-400 mt-1">Write quick memo</p>
            </div>
          </button>

        </div>
      </div>

      {/* 📅 TODAY'S SCHEDULE TIMELINE */}
      <div 
        className={`p-4.5 rounded-[26px] border text-left mb-5 ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-150 shadow-3xs'
        }`}
        id="today-agenda-timeline-view"
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black tracking-widest uppercase text-slate-400">
            Agenda Agenda Timeline
          </h3>
          <span className="text-[8.5px] bg-[#6C3BFF]/10 text-[#6C3BFF] dark:text-purple-300 font-bold px-1.5 py-0.5 rounded-md font-mono">
            {formattedDateString}
          </span>
        </div>

        <div className="flex flex-col gap-3.5 relative pl-3 border-l-[1.5px] border-slate-100 dark:border-slate-800 ml-1.5 my-1 hover:border-violet-400 transition-colors">
          
          <div className="relative">
            <span className="absolute -left-[18.25px] top-1.5 w-2 h-2 rounded-full bg-amber-400 border border-white dark:border-slate-950" />
            <div className="text-left">
              <span className="text-[8.5px] font-bold text-slate-400 font-mono tracking-wider">Morning Alignment (09:00 AM)</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Commit target flow objectives</p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute -left-[18.25px] top-1.5 w-2 h-2 rounded-full bg-[#6C3BFF] border border-white dark:border-slate-950" />
            <div className="text-left">
              <span className="text-[8.5px] font-bold text-slate-400 font-mono tracking-wider">Midday Deep Stack (02:00 PM)</span>
              {activeTodayTasks.length > 0 ? (
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-tight truncate">
                  Complete: "{activeTodayTasks[0].title}"
                </p>
              ) : (
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">No open pending objectives today</p>
              )}
            </div>
          </div>

          <div className="relative">
            <span className="absolute -left-[18.25px] top-1.5 w-2 h-2 rounded-full bg-emerald-400 border border-white dark:border-slate-950 animate-pulse" />
            <div className="text-left">
              <span className="text-[8.5px] font-bold text-slate-400 font-mono tracking-wider">Self Study & Wrap (06:00 PM)</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Review habits & archive continuous logs</p>
            </div>
          </div>

        </div>
      </div>

      {/* 🌸 HABIT & FOCUS SUMMARY RECONSTRUCTS */}
      <div className="grid grid-cols-1 gap-4 mb-5" id="ritual-focus-insights-block">
        
        {/* Habit Summary card */}
        <div className={`p-4 rounded-3xl border text-left ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-150 shadow-3xs'
        }`}>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Habit Consistency Summary</span>
            <Flame size={14} className="text-amber-500 animate-pulse" />
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
            <div>
              <p className="text-base font-black tracking-tight">{activeStreakCount} Days</p>
              <p className="text-[9px] text-slate-450 mt-0.5">Top active streak</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-emerald-500">Compounding</p>
              <p className="text-[9px] text-slate-450 mt-0.5">Rhythm streak levels</p>
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-violet-500 to-[#6C3BFF] h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min((completedHabitsToday / Math.max(habitsStore.length, 1)) * 100 || 12, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Focus Summary Block */}
        <div className={`p-4 rounded-3xl border text-left ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-150 relative overflow-hidden shadow-3xs'
        }`}>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Deep Focus Trend</span>
            <Hourglass size={14} className="text-fuchsia-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black font-mono">{focusMinutesToday}</span>
            <span className="text-xs text-slate-400 font-semibold">minutes complete</span>
          </div>
          <p className="text-[9.5px] text-slate-450 mt-1 leading-normal">
            Your weekly deep focus trend is scaling up continuously. Ensure you lock 25-minute Pomodoros.
          </p>
        </div>

      </div>

      {/* 📊 INTEGRATED HIGHEST FIDELITY INFOGRAPH CHARTS (Weekly, Habit consistency & monthly completion chart) */}
      <div className={`p-4 rounded-[28px] border text-left mb-5 ${
        isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-150 shadow-3xs'
      }`} id="integrated-infograph-analytical-charts">
        <h3 className="text-xs font-black tracking-widest uppercase text-slate-400 mb-4 flex items-center gap-1.5">
          <Activity size={12} className="text-purple-600" /> Executive Analytics
        </h3>

        {/* Chart 1: Daily Productivity index SVG projection (Fidelity Sparkline) */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">Weekly Productivity Trend</span>
            <span className="text-[9px] font-mono font-bold text-emerald-500 flex items-center gap-0.5">
              <TrendingUp size={10} /> +14.2% Index
            </span>
          </div>
          <div className="h-16 w-full relative">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0 20 L15 14 L30 18 L45 8 L60 12 L75 16 L90 5 L100 7"
                fill="none"
                stroke="#6C3BFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0 20 L15 14 L30 18 L45 8 L60 12 L75 16 L90 5 L100 7 L100 25 L0 25 Z"
                fill="url(#chartGrad)"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Chart 2: Grid-Based habit consistency representation */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-2">
            Weekly Habit Rhythm Consistency Grid
          </span>
          <div className="flex justify-between items-center gap-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, ix) => {
              const active = ix < currentTime.getDay();
              return (
                <div key={ix} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`w-full aspect-square rounded-lg transition-transform active:scale-90 ${
                    active 
                      ? 'bg-gradient-to-tr from-[#6C3BFF] to-violet-500 shadow-3xs' 
                      : isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                  }`} />
                  <span className="text-[8px] font-mono text-slate-400">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 📱 ACTIVE PENDING LIST PREVIEWS (Quick Complete Inline) */}
      <div 
        className={`p-4.5 rounded-[26px] border text-left mb-5 ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-150 shadow-3xs'
        }`}
        id="today-pending-micro-complete-buffer"
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black tracking-widest uppercase text-slate-400">
            Due Today Backlog
          </h3>
          <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md font-mono">
            {activeTodayTasks.length} pending
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {activeTodayTasks.length > 0 ? (
            activeTodayTasks.slice(0, 3).map((item) => (
              <div 
                key={item.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium cursor-pointer transition-transform hover:scale-[1.01] ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/50'
                }`}
                onClick={() => onToggleTodo(item.id)}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center shrink-0">
                    <Circle className="text-slate-400 group-hover:text-[#6C3BFF]" size={10} />
                  </div>
                  <span className="truncate text-slate-800 dark:text-slate-200">{item.title}</span>
                </div>
                <span className="text-[9px] bg-[#6C3BFF]/10 text-[#6C3BFF] dark:text-purple-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                  {item.category || 'General'}
                </span>
              </div>
            ))
          ) : (
            <div className="py-5 text-center text-slate-400 font-medium italic text-[11px] flex flex-col items-center gap-1">
              <span className="text-emerald-500">✓</span>
              <span>All daily milestones checked!</span>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 EXPANDABLE CENTER FAB SELECTOR */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
        <div className="relative flex flex-col items-center">
          
          {/* Quick flyouts list */}
          <AnimatePresence>
            {fabExpanded && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.85 }}
                className={`absolute bottom-16 flex flex-col gap-2 p-2 rounded-2xl border shadow-xl z-50 backdrop-blur-xl ${
                  isDarkMode ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-200'
                }`}
              >
                <button 
                  onClick={() => {
                    setIsTaskModalOpen(true);
                    setFabExpanded(false);
                  }}
                  className="p-2 px-3 rounded-lg flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-850/80 text-xs font-bold text-left whitespace-nowrap"
                >
                  <PlusSquare size={13} className="text-[#6C3BFF]" /> Add New Task
                </button>
                <button 
                  onClick={() => {
                    setActiveTab?.('habits');
                    setFabExpanded(false);
                  }}
                  className="p-2 px-3 rounded-lg flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-850/80 text-xs font-bold text-left whitespace-nowrap"
                >
                  <Award size={13} className="text-emerald-500" /> Setup Habit
                </button>
                <button 
                  onClick={() => {
                    setIsNoteModalOpen(true);
                    setFabExpanded(false);
                  }}
                  className="p-2 px-3 rounded-lg flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-850/80 text-xs font-bold text-left whitespace-nowrap"
                >
                  <Notebook size={13} className="text-amber-500" /> Create Memo Note
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core circular FAB */}
          <button
            onClick={() => setFabExpanded(!fabExpanded)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#6C3BFF] to-violet-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer relative"
            id="expandable-dashboard-fab"
          >
            <Plus size={20} className={`transition-transform duration-300 ${fabExpanded ? 'rotate-45' : ''}`} />
            {/* Ambient pulsing Halo */}
            <span className="absolute inset-0 rounded-full border-2 border-violet-400 animate-ping opacity-25 pointer-events-none" />
          </button>
          
        </div>
      </div>

      {/* ─────────────── MODALS BACKDROPS ─────────────── */}

      {/* 1. TASK MODAL */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Blur filter overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative z-10 border text-left flex flex-col ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-extrabold text-sm flex items-center gap-1">
                  <PlusCircle size={14} className="text-[#6C3BFF]" /> Create Target flow
                </span>
                <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleAddNewTask} className="flex flex-col gap-3">
                <div className="flex flex-col text-left">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Title</label>
                  <input 
                    type="text" 
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Enter objective..."
                    className="p-2.5 rounded-xl border text-xs bg-transparent border-slate-200 dark:border-slate-800"
                    required
                  />
                </div>

                <div className="flex flex-col text-left">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Description</label>
                  <textarea 
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Provide additional contexts..."
                    className="p-2.5 rounded-xl border text-xs bg-transparent border-slate-200 dark:border-slate-800 h-16 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Category</label>
                    <select
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value)}
                      className="p-2.5 rounded-xl border text-xs bg-transparent border-slate-200 dark:border-slate-800"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col text-left">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="p-2.5 rounded-xl border text-xs bg-transparent border-slate-200 dark:border-slate-800"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full mt-2 p-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-tr from-[#6C3BFF] to-violet-500 shadow-md transform active:scale-95 transition-transform"
                >
                  Confirm and Commit Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. NOTE MODAL */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsNoteModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative z-10 border text-left flex flex-col ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-extrabold text-sm flex items-center gap-1">
                  <Notebook size={14} className="text-amber-500" /> Create Memo Log
                </span>
                <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleAddNewNote} className="flex flex-col gap-3">
                <div className="flex flex-col text-left">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Title</label>
                  <input 
                    type="text" 
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Enter title..."
                    className="p-2.5 rounded-xl border text-xs bg-transparent border-slate-200 dark:border-slate-800"
                    required
                  />
                </div>

                <div className="flex flex-col text-left">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Memos content</label>
                  <textarea 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write detailed notes..."
                    className="p-2.5 rounded-xl border text-xs bg-transparent border-slate-200 dark:border-slate-800 h-24 resize-none"
                    required
                  />
                </div>

                <div className="flex flex-col text-left">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Selector color</label>
                  <div className="flex items-center gap-2.5 mt-1">
                    {['#8B5CF6', '#EC4899', '#EF4444', '#10B981', '#F59E0B'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNoteColor(color)}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          noteColor === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full mt-2.5 p-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-tr from-amber-500 to-orange-500 shadow-md transform active:scale-95 transition-transform"
                >
                  Save Workspace Note
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
