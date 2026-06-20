import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Trophy,
  Activity,
  Award,
  BookOpen,
  Coffee,
  Heart,
  Moon,
  Compass,
  Tag,
  CheckCircle2,
  Circle,
  TrendingUp,
  X,
  Target
} from 'lucide-react';
import { Habit } from '../types';

// Pre-seeded high-fidelity sample habits
const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'Sunrise Morning Stretch',
    description: '10 minutes of light yoga and deep breathing to wake up the nervous system.',
    frequency: 'daily',
    createdAt: '2026-06-10T08:00:00Z',
    streak: 5,
    bestStreak: 8,
    history: {
      '2026-06-19': true, // today
      '2026-06-18': true,
      '2026-06-17': true,
      '2026-06-16': true,
      '2026-06-15': true,
    },
    color: 'violet',
    tags: ['Mindfulness', 'Health']
  },
  {
    id: 'habit-2',
    name: 'Mindful Journaling',
    description: 'Write down 3 things I am grateful for and my main focus for the day.',
    frequency: 'daily',
    createdAt: '2026-06-08T18:00:00Z',
    streak: 8,
    bestStreak: 12,
    history: {
      '2026-06-18': true,
      '2026-06-17': true,
      '2026-06-16': true,
      '2026-06-15': true,
      '2026-06-14': true,
      '2026-06-13': true,
      '2026-06-12': true,
      '2026-06-11': true,
    },
    color: 'indigo',
    tags: ['Self-Care', 'Reflection']
  },
  {
    id: 'habit-3',
    name: 'Stay Hydrated (3L Daily)',
    description: 'Drink a glass of water every 1-2 hours and track using reusable bottle.',
    frequency: 'daily',
    createdAt: '2026-06-01T07:00:00Z',
    streak: 12,
    bestStreak: 15,
    history: {
      '2026-06-19': true, // today
      '2026-06-18': true,
      '2026-06-17': true,
      '2026-06-16': true,
      '2026-06-15': true,
      '2026-06-14': true,
      '2026-06-13': true,
      '2026-06-12': true,
      '2026-06-11': true,
      '2026-06-10': true,
      '2026-06-09': true,
      '2026-06-08': true,
    },
    color: 'sky',
    tags: ['Fitness', 'Vigour']
  },
  {
    id: 'habit-4',
    name: 'Read 10 Pages',
    description: 'Currently reading "Deep Work" by Cal Newport. Focus on ad-free absorption.',
    frequency: 'daily',
    createdAt: '2026-06-12T20:00:00Z',
    streak: 3,
    bestStreak: 5,
    history: {
      '2026-06-19': true,
      '2026-06-18': true,
      '2026-06-17': true,
      '2026-06-15': true,
    },
    color: 'emerald',
    tags: ['Intellect', 'Growth']
  }
];

const STAGE_PRESETS = [
  { name: 'Meditation', desc: '10 min mindfulness session', color: 'violet', tags: ['Zen'] },
  { name: 'Limit Screen Time', desc: 'No phone 1 hour before sleep', color: 'indigo', tags: ['Habit'] },
  { name: 'Coding Drill', desc: 'Write code or solve 1 algorithmic challenge', color: 'sky', tags: ['Skills'] },
  { name: 'Healthy Meal', desc: 'Eat a nutrient-dense whole-food meal', color: 'emerald', tags: ['Nutrition'] },
  { name: 'Express Gratitude', desc: 'Thank a peer or write down positive interactions', color: 'amber', tags: ['Mind'] }
];

const ACCENT_COLOR_MAP: Record<string, string> = {
  indigo: 'from-indigo-500 to-violet-600 border-indigo-200 text-indigo-700 bg-indigo-50/50',
  rose: 'from-rose-500 to-pink-600 border-rose-200 text-rose-700 bg-rose-50/50',
  emerald: 'from-emerald-500 to-teal-600 border-emerald-200 text-emerald-700 bg-emerald-50/50',
  amber: 'from-amber-500 to-orange-600 border-amber-200 text-amber-700 bg-amber-50/50',
  sky: 'from-sky-500 to-indigo-600 border-sky-200 text-sky-700 bg-sky-50/50',
  violet: 'from-purple-500 to-violet-700 border-purple-200 text-purple-700 bg-purple-50/50'
};

const TEXT_ACCENT_MAP: Record<string, string> = {
  indigo: 'text-indigo-600',
  rose: 'text-rose-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  sky: 'text-sky-500',
  violet: 'text-purple-600'
};

const BG_ACCENT_MAP: Record<string, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-100Description',
  rose: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-100',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-100',
  amber: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-100',
  sky: 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-100',
  violet: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-100'
};

interface HabitsViewProps {
  accentColor: string; // The active app profile accent color
}

export default function HabitsView({ accentColor }: HabitsViewProps) {
  // Load initial habits from local storage or pre-seed defaults
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('premium_habits_store');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_HABITS;
      }
    }
    return DEFAULT_HABITS;
  });

  const saveHabits = (newHabits: Habit[]) => {
    setHabits(newHabits);
    localStorage.setItem('premium_habits_store', JSON.stringify(newHabits));
  };

  // Tracking date window (Default is today: 2026-06-19)
  const today = new Date('2026-06-19T12:00:00-07:00'); 
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [habitColor, setHabitColor] = useState<string>('violet');
  const [habitTags, setHabitTags] = useState<string[]>([]);
  const [tempTag, setTempTag] = useState('');

  // Helper formatting dates to YYYY-MM-DD
  const formatDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Re-calculate the active consecutive streak dynamically
  const calculateLiveStreak = (history: Record<string, boolean>): number => {
    let streakCount = 0;
    const check = new Date(today);
    
    // YYYY-MM-DD check helper
    const checkStr = formatDateStr(check);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateStr(yesterday);

    // If neither today nor yesterday is checked, the streak is broken (0)
    if (!history[checkStr] && !history[yesterdayStr]) {
      return 0;
    }

    // Set starting check date based on whether today is completed
    const currentCheck = history[checkStr] ? new Date(today) : yesterday;

    while (true) {
      const currentStr = formatDateStr(currentCheck);
      if (history[currentStr]) {
        streakCount++;
        currentCheck.setDate(currentCheck.getDate() - 1); // move back one day
      } else {
        break;
      }
    }
    return streakCount;
  };

  // Toggle habit check status for a specific date string
  const handleToggleHabit = (habitId: string, dateStr: string) => {
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const nextHistory = { ...h.history };
        const currentlyChecked = nextHistory[dateStr] || false;
        
        if (currentlyChecked) {
          delete nextHistory[dateStr];
        } else {
          nextHistory[dateStr] = true;
        }

        // Live recalculate current streak
        const nextStreak = calculateLiveStreak(nextHistory);
        const nextBest = Math.max(h.bestStreak, nextStreak);

        return {
          ...h,
          history: nextHistory,
          streak: nextStreak,
          bestStreak: nextBest
        };
      }
      return h;
    });
    saveHabits(updated);
  };

  // Add tag builder helper
  const handleAddTag = () => {
    if (!tempTag.trim()) return;
    const cleaned = tempTag.trim().toLowerCase().replace(/^#/, '');
    if (cleaned && !habitTags.includes(cleaned)) {
      setHabitTags([...habitTags, cleaned]);
    }
    setTempTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setHabitTags(habitTags.filter(t => t !== tagToRemove));
  };

  // Setup form with preset values
  const applyPreset = (preset: typeof STAGE_PRESETS[0]) => {
    setHabitName(preset.name);
    setHabitDescription(preset.desc);
    setHabitColor(preset.color);
    setHabitTags(preset.tags);
  };

  // CRUD handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    let finalTags = [...habitTags];
    if (tempTag.trim()) {
      const cleaned = tempTag.trim().toLowerCase().replace(/^#/, '');
      if (cleaned && !finalTags.includes(cleaned)) {
        finalTags.push(cleaned);
      }
    }

    if (editingHabitId) {
      // Edit mode
      const updated = habits.map(h => {
        if (h.id === editingHabitId) {
          const liveStreak = calculateLiveStreak(h.history);
          return {
            ...h,
            name: habitName.trim(),
            description: habitDescription.trim() || undefined,
            frequency: habitFrequency,
            color: habitColor,
            tags: finalTags.length > 0 ? finalTags : undefined,
            streak: liveStreak,
            bestStreak: Math.max(h.bestStreak, liveStreak)
          };
        }
        return h;
      });
      saveHabits(updated);
    } else {
      // Create mode
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        name: habitName.trim(),
        description: habitDescription.trim() || undefined,
        frequency: habitFrequency,
        createdAt: new Date().toISOString(),
        streak: 0,
        bestStreak: 0,
        history: {},
        color: habitColor,
        tags: finalTags.length > 0 ? finalTags : undefined
      };
      saveHabits([...habits, newHabit]);
    }

    // Reset fields
    handleCloseForm();
  };

  const handleEditClick = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setHabitName(habit.name);
    setHabitDescription(habit.description || '');
    setHabitFrequency(habit.frequency);
    setHabitColor(habit.color);
    setHabitTags(habit.tags || []);
    setIsAddOpen(true);
  };

  const handleDeleteHabit = (id: string) => {
    if (window.confirm("Are you sure you want to delete this habit and clear all history?")) {
      const updated = habits.filter(h => h.id !== id);
      saveHabits(updated);
    }
  };

  const handleCloseForm = () => {
    setEditingHabitId(null);
    setHabitName('');
    setHabitDescription('');
    setHabitFrequency('daily');
    setHabitColor('violet');
    setHabitTags([]);
    setTempTag('');
    setIsAddOpen(false);
  };

  // Stat computations
  const targetDateStr = formatDateStr(selectedDate);
  const applicableHabits = habits.filter(h => {
    if (h.frequency === 'daily') return true;
    // For weekly habits, let's include them as actionable daily checkpoints or filter on weekly goal
    return true;
  });
  
  const completedTodayCount = applicableHabits.filter(h => h.history[targetDateStr]).length;
  const habitsPerfectRatio = applicableHabits.length > 0 ? (completedTodayCount / applicableHabits.length) * 100 : 0;

  // Generate recent 7 days sequence relative to today YYYY-MM-DD
  const getRecent7Days = (): Date[] => {
    const list: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const check = new Date(today);
      check.setDate(check.getDate() - i);
      list.push(check);
    }
    return list;
  };

  const recent7Days = getRecent7Days();

  // Compute daily performance for each day in list to show inside Weekly Statistics Bar Chart
  const getDayEfficiencyPercentage = (dateCheck: Date): number => {
    const checkStr = formatDateStr(dateCheck);
    const totalHabitsExists = habits.length;
    if (totalHabitsExists === 0) return 0;
    const count = habits.filter(h => h.history[checkStr]).length;
    return (count / totalHabitsExists) * 100;
  };

  return (
    <div className="flex flex-col gap-6" id="habits-tracker-page-canvas">
      
      {/* 🔮 Top Ambient High-Fidelity Stats Widget */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden"
        id="habit-dashboard-stats-card"
      >
        {/* Absolute decorative gradient highlights */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-16 w-32 h-32 bg-indigo-500/30 rounded-full blur-xl pointer-events-none" />

        <div className="flex justify-between items-center relative z-10">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-purple-200">
              Personal Mastery
            </span>
            <h2 className="text-xl font-black tracking-tight font-display mb-0.5">
              Habits Dashboard
            </h2>
            <p className="text-xs text-purple-100/80 leading-relaxed font-semibold max-w-[210px]">
              {completedTodayCount} of {applicableHabits.length} habits completed for today.
            </p>
          </div>

          {/* 🧠 Premium Purple Progress Circle */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="36"
                className="stroke-purple-800/60 fill-transparent"
                strokeWidth="7"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="36"
                className="stroke-amber-400 fill-transparent stroke-linecap-round"
                strokeWidth="7"
                strokeDasharray={2 * Math.PI * 36}
                initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 36) * (1 - (habitsPerfectRatio / 100)) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black tracking-tighter leading-none text-white">
                {Math.round(habitsPerfectRatio)}%
              </span>
              <span className="text-[8px] uppercase tracking-wider text-purple-200 font-bold mt-1">
                Completed
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Streak Badges row */}
        <div className="grid grid-cols-2 gap-3.5 border-t border-white/10 mt-5 pt-4 z-10 relative">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300">
              <Trophy size={16} />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-purple-200 font-semibold leading-none">Best Habit Streak</p>
              <p className="text-base font-black text-white mt-1">
                {habits.length > 0 ? Math.max(...habits.map(h => h.bestStreak), 0) : 0} days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-rose-300">
              <Flame size={16} className="fill-current" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-purple-200 font-semibold leading-none">Total Habits Active</p>
              <p className="text-base font-black text-white mt-1">
                {habits.length} Items
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 📊 Weekly Statistics Grid */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col gap-4">
        <div className="flex justify-between items-center text-left">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight font-display">Weekly Progress</h3>
            <p className="text-[10px] text-slate-400 font-medium font-sans">Consistency stats over the last 7 days</p>
          </div>
          <Activity size={15} className="text-indigo-500" />
        </div>

        <div className="grid grid-cols-7 gap-1 px-1" id="habits-weekly-performance-bars">
          {recent7Days.map((dateItem) => {
            const dateStr = formatDateStr(dateItem);
            const isTargetDay = formatDateStr(selectedDate) === dateStr;
            const efficiency = getDayEfficiencyPercentage(dateItem);
            const isToday = formatDateStr(today) === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateItem)}
                className={`flex flex-col items-center gap-2 py-2.5 rounded-xl transition-all cursor-pointer ${
                  isTargetDay 
                    ? 'bg-indigo-50/75 border border-indigo-200/60' 
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                {/* Visual Efficiency Bar */}
                <div className="w-1.5 h-16 bg-slate-100 rounded-full flex flex-col justify-end overflow-hidden">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${efficiency}%` }}
                    className={`w-full rounded-full ${
                      efficiency >= 100 
                        ? 'bg-gradient-to-t from-indigo-500 to-purple-600' 
                        : 'bg-gradient-to-t from-violet-400 to-indigo-500'
                    }`}
                  />
                </div>

                {/* Day Label */}
                <div className="flex flex-col items-center gap-0.5 mt-0.5">
                  <span className="text-[9px] font-bold font-mono text-slate-400 uppercase">
                    {dateItem.toLocaleDateString([], { weekday: 'narrow' })}
                  </span>
                  <span className={`text-[10px] font-bold font-mono px-1 rounded-sm ${
                    isToday 
                      ? 'bg-indigo-600 text-white font-black' 
                      : isTargetDay ? 'text-indigo-600 font-black' : 'text-slate-600'
                  }`}>
                    {dateItem.getDate()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 📑 Habits Dynamic Action Grid Group */}
      <div className="flex flex-col gap-3.5">
        <div className="flex justify-between items-center text-left">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Habits Checklist</span>
              <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-bold font-mono text-slate-500">
                {selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold font-sans">Tap circular rings to complete tasks</p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            id="btn-trigger-new-habit-flow"
            className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Habit</span>
          </button>
        </div>

        {/* Checklist Container */}
        {applicableHabits.length > 0 ? (
          <div className="flex flex-col gap-3" id="habits-list-checklist">
            {applicableHabits.map((h) => {
              const isCompleted = h.history[targetDateStr] || false;
              const colorValue = h.color || 'violet';
              const textAccent = TEXT_ACCENT_MAP[colorValue] || 'text-purple-600';
              const bgAccent = BG_ACCENT_MAP[colorValue] || 'bg-purple-600';
              const premiumColorClass = ACCENT_COLOR_MAP[colorValue] || 'border-purple-200 text-purple-700 bg-purple-50-50';

              return (
                <motion.div
                  key={h.id}
                  id={`habit-record-block-${h.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-2xl p-4 flex gap-3 transition-all relative ${
                    isCompleted 
                      ? 'bg-slate-50 border-slate-200/80' 
                      : 'bg-white border-slate-100 shadow-xs'
                  }`}
                >
                  {/* Interactive toggle status check-circle */}
                  <button
                    onClick={() => handleToggleHabit(h.id, targetDateStr)}
                    className="mt-0.5 transition-transform shrink-0 cursor-pointer hover:scale-105 active:scale-95 text-slate-300"
                    id={`habit-toggle-trigger-${h.id}`}
                  >
                    {isCompleted ? (
                      <div className={`p-1 rounded-full ${bgAccent} text-white`}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className={`w-6 h-6 rounded-full border-2 border-slate-200/80 bg-white hover:border-slate-400 transition-colors`} />
                    )}
                  </button>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-xs font-bold leading-snug truncate ${
                        isCompleted ? 'line-through text-slate-400 font-normal' : 'text-slate-800'
                      }`}>
                        {h.name}
                      </h4>
                      
                      {/* Live Actions drop down / edit group */}
                      <div className="flex items-center gap-1.5 shrink-0" id={`habit-action-triggers-${h.id}`}>
                        <button
                          onClick={() => handleEditClick(h)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                          title="Edit Habit"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteHabit(h.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 transition-all cursor-pointer"
                          title="Delete Habit"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {h.description && (
                      <p className={`text-[10px] mt-1 pr-4 leading-normal ${
                        isCompleted ? 'text-slate-400/70' : 'text-slate-500'
                      }`}>
                        {h.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {/* Active Streak Indicator */}
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-140/40 text-amber-700 font-mono">
                        <Flame size={10} className="fill-current text-amber-500" />
                        <span>{h.streak} Day Streak</span>
                      </span>

                      {/* Best Streak Label */}
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200/50 text-slate-500 font-mono">
                        <Award size={10} />
                        <span>Best: {h.bestStreak}d</span>
                      </span>

                      {/* Tag badging */}
                      {h.tags && h.tags.map(t => (
                        <span
                          key={t}
                          className="inline-flex items-center text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/30"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 rounded-3xl py-10 px-5 text-center flex flex-col items-center justify-center gap-2 bg-slate-50/20">
            <span className="text-xs font-semibold text-slate-400">Your habits routine is empty</span>
            <button
              onClick={() => setIsAddOpen(true)}
              className="text-[10px] font-bold tracking-wider text-indigo-600 hover:text-indigo-800 underline uppercase cursor-pointer"
            >
              + Create Your First Habit
            </button>
          </div>
        )}
      </div>

      {/* 🏆 Creator Habits Dialog Form */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full border border-slate-100 relative max-h-[90vh] overflow-y-auto no-scrollbar"
              id="habit-creator-modal-panel"
            >
              <button
                onClick={handleCloseForm}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>

              <div className="flex items-center gap-2 text-left mb-4 pb-2 border-b border-slate-100">
                <Sparkles size={16} className="text-violet-600" />
                <h3 className="text-sm font-black text-slate-800 tracking-tight font-display">
                  {editingHabitId ? 'Modify Habit Settings' : 'Program New Habit'}
                </h3>
              </div>

              {/* Presets suggestions to speed up entry */}
              {!editingHabitId && (
                <div className="mb-4">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">
                    Quick suggestions presets
                  </label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1 no-scrollbar scroll-smooth">
                    {STAGE_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className="flex-none bg-slate-50 hover:bg-slate-100 border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-semibold text-slate-600 cursor-pointer transition-all"
                      >
                        +{p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-left">
                {/* Name */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Morning Meditate, HIIT Drill"
                    value={habitName}
                    id="input-habit-form-name"
                    onChange={(e) => setHabitName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-slate-400 focus:ring-1 focus:ring-slate-200 font-medium bg-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Description / Intention
                  </label>
                  <textarea
                    placeholder="Write a clear cue or why you do this..."
                    value={habitDescription}
                    id="input-habit-form-desc"
                    onChange={(e) => setHabitDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-slate-400 focus:ring-1 focus:ring-slate-200 font-medium bg-white lg:resize-none"
                  />
                </div>

                {/* Selection Row: Frequency & Theme Color */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                      Frequency
                    </label>
                    <select
                      value={habitFrequency}
                      id="dropdown-habit-form-frequency"
                      onChange={(e) => setHabitFrequency(e.target.value as 'daily' | 'weekly')}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-semibold text-slate-600 bg-white"
                    >
                      <option value="daily">🔥 Daily Cue</option>
                      <option value="weekly">📆 Weekly Target</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                      Theme Color Accent
                    </label>
                    <select
                      value={habitColor}
                      id="dropdown-habit-form-color"
                      onChange={(e) => setHabitColor(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-semibold text-slate-600 bg-white capitalize"
                    >
                      <option value="violet">💜 Violet</option>
                      <option value="indigo">💙 Indigo</option>
                      <option value="sky">🩵 Sky</option>
                      <option value="emerald">💚 Emerald</option>
                      <option value="amber">💛 Amber</option>
                      <option value="rose">❤️ Rose</option>
                    </select>
                  </div>
                </div>

                {/* Tags builder */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Custom tags
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-slate-400 focus:ring-1 focus:ring-slate-200 bg-white font-medium placeholder:text-slate-400"
                      placeholder="Press Enter to add tag"
                      value={tempTag}
                      id="input-habit-form-tag"
                      onChange={(e) => setTempTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                    >
                      Add
                    </button>
                  </div>
                  {habitTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {habitTags.map(t => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-0.5 rounded-full text-[9px] font-semibold text-slate-600 border border-slate-200"
                        >
                          <span>#{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Row */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-1">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all text-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-habit-form-submit"
                    className="py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all text-center cursor-pointer shadow-tiny"
                  >
                    {editingHabitId ? 'Save Changes' : 'Launch Habit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
