import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Inbox, 
  Sparkles,
  Check,
  CalendarDays,
  ListTodo,
  CalendarRange,
  Zap,
  Trash2,
  Clock,
  SlidersHorizontal,
  X,
  Volume2,
  VolumeX,
  MapPin,
  TrendingUp,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { Todo } from '../types';
import AIPlannerWidget from './AIPlannerWidget';

interface CalendarViewProps {
  todos: Todo[];
  onToggleTodo: (id: string) => void;
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  onUpdateTodo?: (id: string, updatedFields: Partial<Todo>) => void;
  accentColor: string;
}

// Color maps for aesthetic integration
const PRIORITY_COLOR_MAP: Record<string, string> = {
  high: 'bg-rose-500 shadow-rose-200',
  medium: 'bg-amber-400 shadow-amber-100',
  low: 'bg-emerald-400 shadow-emerald-100'
};

const CATEGORY_ICONS: Record<string, string> = {
  Personal: '🏠',
  Work: '💼',
  Wellness: '🧘',
  Shopping: '🛒',
  Urgent: '🔥'
};

export default function CalendarView({
  todos,
  onToggleTodo,
  onAddTodo,
  onUpdateTodo,
  accentColor,
}: CalendarViewProps) {
  // Navigation & View Mode configuration
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'ai'>('month');
  const [currentDate, setCurrentDate] = useState(new Date('2026-06-19T12:00:00-07:00')); // Selected pivot date (Anchor today: 2026-06-19)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-06-19');

  // Interactive Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Personal');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('2026-06-19');

  // Drag and Drop Dragged Item State
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);

  // Audio trigger
  const [soundEnabled, setSoundEnabled] = useState(true);

  const triggerSoundFeedback = (frequency = 520, type: OscillatorType = 'sine', duration = 0.08) => {
    if (localStorage.getItem('acoustic_chimes_enabled') === 'false') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.02);
    } catch (e) {}
  };

  // Date Parsing Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevRange = () => {
    triggerSoundFeedback(440, 'triangle', 0.06);
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const handleNextRange = () => {
    triggerSoundFeedback(480, 'triangle', 0.06);
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const handleJumpToToday = () => {
    triggerSoundFeedback(587.33, 'triangle', 0.1);
    const today = new Date('2026-06-19T12:00:00-07:00');
    setCurrentDate(today);
    setSelectedDateStr('2026-06-19');
  };

  // MONTHLY GRID GENERATION
  const getMonthlyDays = () => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const arr: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateObj = new Date(prevY, prevM, dayNum);
      const offset = dateObj.getTimezoneOffset();
      const norm = new Date(dateObj.getTime() - (offset * 60 * 1000));
      arr.push({
        day: dayNum,
        isCurrentMonth: false,
        dateStr: norm.toISOString().split('T')[0]
      });
    }

    // Active month
    for (let i = 1; i <= totalDays; i++) {
      const dateObj = new Date(year, month, i);
      const offset = dateObj.getTimezoneOffset();
      const norm = new Date(dateObj.getTime() - (offset * 60 * 1000));
      arr.push({
        day: i,
        isCurrentMonth: true,
        dateStr: norm.toISOString().split('T')[0]
      });
    }

    // Next month padding
    const remaining = 42 - arr.length;
    for (let i = 1; i <= remaining; i++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateObj = new Date(nextY, nextM, i);
      const offset = dateObj.getTimezoneOffset();
      const norm = new Date(dateObj.getTime() - (offset * 60 * 1000));
      arr.push({
        day: i,
        isCurrentMonth: false,
        dateStr: norm.toISOString().split('T')[0]
      });
    }

    return arr;
  };

  // WEEKLY GRID GENERATION (Determined around currentDate)
  const getWeeklyDays = () => {
    const arr: { day: number; isCurrentMonth: boolean; dateStr: string; weekdayLabel: string }[] = [];
    const currentDayOfWeek = currentDate.getDay(); // 0 is Sunday
    
    // Create starting range of sunday of current pivot week
    const sunPivot = new Date(currentDate);
    sunPivot.setDate(currentDate.getDate() - currentDayOfWeek);

    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const cursor = new Date(sunPivot);
      cursor.setDate(sunPivot.getDate() + i);
      const offset = cursor.getTimezoneOffset();
      const norm = new Date(cursor.getTime() - (offset * 60 * 1000));
      arr.push({
        day: cursor.getDate(),
        isCurrentMonth: cursor.getMonth() === month,
        dateStr: norm.toISOString().split('T')[0],
        weekdayLabel: labels[i]
      });
    }

    return arr;
  };

  // Drag Event Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTodoId(id);
    triggerSoundFeedback(330, 'sine', 0.04);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverCell = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (hoveredDateStr !== dateStr) {
      setHoveredDateStr(dateStr);
    }
  };

  const handleDragLeaveCell = () => {
    setHoveredDateStr(null);
  };

  const handleDropOnCell = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const todoId = draggedTodoId || e.dataTransfer.getData('text/plain');
    if (todoId && onUpdateTodo) {
      onUpdateTodo(todoId, { dueDate: dateStr });
      triggerSoundFeedback(660, 'sine', 0.15); // Drop Zen Bell audio indicator
      setSelectedDateStr(dateStr);
    }
    setDraggedTodoId(null);
    setHoveredDateStr(null);
  };

  // Submitting detailed calendar task event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    onAddTodo({
      title: formTitle.trim(),
      completed: false,
      category: formCategory,
      priority: formPriority,
      dueDate: formDate,
      description: formDescription.trim() || undefined
    });

    // Reset Form Input State
    setFormTitle('');
    setFormDescription('');
    setIsAddModalOpen(false);
    setSelectedDateStr(formDate);
    triggerSoundFeedback(880, 'sine', 0.2);
  };

  const triggerOpenAddModal = (dateStr: string) => {
    setFormDate(dateStr);
    setIsAddModalOpen(true);
    triggerSoundFeedback(440, 'sine', 0.05);
  };

  // Filtering agenda items for selected slot target
  const selectedDateTasks = todos.filter(t => t.dueDate === selectedDateStr);
  const selectedCompletedRatio = selectedDateTasks.length > 0 
    ? (selectedDateTasks.filter(t => t.completed).length / selectedDateTasks.length) * 100
    : 0;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex flex-col gap-6" id="premium-glass-calendar-canvas">
      
      {/* 🔮 TOP GLASS NAVIGATION BAR WITH VIEW SWITCH (Premium Glassmorphism Style) */}
      <div 
        className="bg-white/70 backdrop-blur-md border border-white/40 p-4.5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left relative overflow-hidden"
        id="calendar-glass-topbar"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full inline-block mb-1 border border-violet-100">
            Intelligent Schedule
          </span>
          <h2 className="text-lg font-black tracking-tight text-slate-800 font-display flex items-center gap-1.5">
            <span>Flow Calendar</span>
            <Sparkles size={15} className="text-purple-600 animate-pulse" />
          </h2>
        </div>

        {/* View Mode Switcher and Today anchor */}
        <div className="flex items-center gap-2" id="calendar-mode-buttons">
          <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setViewMode('month');
                triggerSoundFeedback(392, 'square', 0.04);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold tracking-wide uppercase transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'month' 
                  ? 'bg-violet-600 text-white shadow-tiny' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays size={11} />
              <span>Month</span>
            </button>
            <button
              onClick={() => {
                setViewMode('week');
                triggerSoundFeedback(440, 'square', 0.04);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold tracking-wide uppercase transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'week' 
                  ? 'bg-violet-600 text-white shadow-tiny' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarRange size={11} />
              <span>Week</span>
            </button>
            <button
              onClick={() => {
                setViewMode('ai');
                triggerSoundFeedback(523, 'square', 0.04);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold tracking-wide uppercase transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'ai' 
                  ? 'bg-gradient-to-tr from-[#6C3BFF] to-fuchsia-600 text-white shadow-tiny' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles size={11} className={viewMode === 'ai' ? 'animate-pulse' : ''} />
              <span>AI Copilot</span>
            </button>
          </div>

          <button
            onClick={handleJumpToToday}
            className="p-1.5 rounded-xl border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-slate-600 font-bold text-[10px] uppercase font-mono px-3 py-1.5"
            title="Focus Today"
          >
            Today
          </button>
        </div>
      </div>

      {viewMode === 'ai' ? (
        <AIPlannerWidget
          todos={todos}
          onAddTodo={onAddTodo}
          accentColor={accentColor}
        />
      ) : (
        <>
          {/* 📅 INTEGRATED CALENDAR GRID CONTROL BENCH (Glassmorphism design) */}
          <motion.div
        layout
        className="bg-white/80 backdrop-blur-lg border border-slate-200/60 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col gap-4 text-left"
        id="integrated-calendar-grid-card"
      >
        <div className="absolute right-0 top-0 w-36 h-36 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Dynamic header label representing Month/Week details */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <CalendarIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight font-display mb-0.5 leading-none">
                {viewMode === 'month' 
                  ? `${monthNames[month]} ${year}`
                  : `Week of ${currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                }
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold font-sans">
                Drag checklist tasks over days to reschedule plans instantly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5" id="nav-arrow-buttons">
            <button
              onClick={handlePrevRange}
              className="p-2 rounded-xl border border-slate-150 hover:bg-slate-50 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
              title="Previous"
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
            </button>
            <button
              onClick={handleNextRange}
              className="p-2 rounded-xl border border-slate-150 hover:bg-slate-50 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
              title="Next"
            >
              <ChevronRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* THE RENDER ENGINE */}
        {viewMode === 'month' ? (
          /* MONTHLY 42-CELL GRID SYSTEM */
          <div className="flex flex-col gap-1.5">
            {/* Su Mo Tu We Th Fr Sa Row labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono font-black text-[10px] uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-100">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w, idx) => (
                <div key={idx} className="font-bold">{w}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5" id="monthly-days-grid-interactive">
              {getMonthlyDays().map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const isToday = cell.dateStr === '2026-06-19';
                const isHovered = hoveredDateStr === cell.dateStr;

                const dayTodos = todos.filter(t => t.dueDate === cell.dateStr);
                const completedCount = dayTodos.filter(t => t.completed).length;
                const outstandingCount = dayTodos.length - completedCount;

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onDragOver={(e) => handleDragOverCell(e, cell.dateStr)}
                    onDragLeave={handleDragLeaveCell}
                    onDrop={(e) => handleDropOnCell(e, cell.dateStr)}
                    className="relative"
                  >
                    <button
                      onClick={() => {
                        setSelectedDateStr(cell.dateStr);
                        triggerSoundFeedback(523, 'sine', 0.05);
                      }}
                      onDoubleClick={() => triggerOpenAddModal(cell.dateStr)}
                      className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-between p-1.5 border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-violet-500 shadow-tiny font-bold z-10 scale-102 ring-4 ring-purple-100'
                          : isToday
                          ? 'bg-purple-50 border-purple-200 text-purple-700 font-extrabold shadow-3xs'
                          : cell.isCurrentMonth
                          ? 'bg-transparent text-slate-700 hover:bg-slate-50 border-transparent hover:border-slate-150'
                          : 'bg-transparent text-slate-350 opacity-45 border-transparent'
                      } ${isHovered ? 'ring-4 ring-indigo-400 border-indigo-400 bg-indigo-50/50 scale-105 z-20' : ''}`}
                    >
                      {/* Day number */}
                      <span className="text-xs font-bold leading-none">{cell.day}</span>

                      {/* Display scheduled task badges / indicator nodes */}
                      {dayTodos.length > 0 && (
                        <div className="flex flex-col gap-0.5 justify-center w-full mt-1">
                          {/* Display micro colored line block to show task density */}
                          <div className="flex gap-0.5 justify-center">
                            {dayTodos.slice(0, 3).map((todo, tIdx) => (
                              <span
                                key={todo.id}
                                className={`w-1 h-1 rounded-full ${
                                  isSelected 
                                    ? 'bg-white' 
                                    : todo.completed 
                                    ? 'bg-slate-300' 
                                    : PRIORITY_COLOR_MAP[todo.priority] || 'bg-indigo-500'
                                }`}
                              />
                            ))}
                          </div>
                          
                          {/* Desktop friendly density text indicator */}
                          {outstandingCount > 0 && (
                            <span className={`text-[7px] font-black font-mono tracking-tight mt-0.5 text-center leading-none ${
                              isSelected ? 'text-purple-100' : 'text-indigo-600'
                            }`}>
                              {outstandingCount} left
                            </span>
                          )}
                        </div>
                      )}
                    </button>

                    {/* Desktop fast-flow '+' quick add hover badge */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerOpenAddModal(cell.dateStr);
                      }}
                      className="absolute top-1 right-1 opacity-0 hover:opacity-100 hover:bg-slate-800 hover:text-white p-0.5 rounded-md transition-all text-[8px]"
                    >
                      <Plus size={8} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* WEEKLY COMPACT INTERACTIVE ROW GRID */
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-7 gap-2.5" id="weekly-view-days-interactive">
              {getWeeklyDays().map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const isToday = cell.dateStr === '2026-06-19';
                const isHovered = hoveredDateStr === cell.dateStr;

                const dayTodos = todos.filter(t => t.dueDate === cell.dateStr);
                const pendingCount = dayTodos.filter(t => !t.completed).length;

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onDragOver={(e) => handleDragOverCell(e, cell.dateStr)}
                    onDragLeave={handleDragLeaveCell}
                    onDrop={(e) => handleDropOnCell(e, cell.dateStr)}
                    className="relative"
                  >
                    <button
                      onClick={() => {
                        setSelectedDateStr(cell.dateStr);
                        triggerSoundFeedback(587.33, 'sine', 0.05);
                      }}
                      className={`w-full py-4.5 px-1 rounded-2xl flex flex-col items-center justify-between gap-3 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-violet-500 font-bold scale-102 ring-4 ring-purple-100 shadow-tiny'
                          : isToday
                          ? 'bg-purple-50 border-purple-200 text-purple-700 font-black shadow-3xs'
                          : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-100/60'
                      } ${isHovered ? 'ring-4 ring-indigo-400 border-indigo-400 bg-indigo-50/50 scale-105 z-20' : ''}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-bold">
                          {cell.weekdayLabel}
                        </span>
                        <span className="text-sm font-black tracking-tight">{cell.day}</span>
                      </div>

                      {/* Pending Tasks indicators */}
                      <div className="flex flex-col items-center">
                        {dayTodos.length > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex gap-0.5 justify-center">
                              {dayTodos.slice(0, 3).map((todo) => (
                                <span
                                  key={todo.id}
                                  className={`w-1 h-1 rounded-full ${
                                    isSelected ? 'bg-white' : PRIORITY_COLOR_MAP[todo.priority]
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`text-[8px] font-bold font-mono px-1 rounded ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                            }`}>
                              {pendingCount} left
                            </span>
                          </div>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        )}
                      </div>
                    </button>
                    
                    {/* Double-click addition cue */}
                    <button
                      type="button"
                      onClick={() => triggerOpenAddModal(cell.dateStr)}
                      className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 bg-slate-100 p-0.5 rounded-lg text-slate-500 hover:text-slate-800 text-[8px]"
                    >
                      <Plus size={8} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* 🔮 TODAY'S SELECTED DAY AGENDA (Frosted Slate/Purple accents) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5" id="calendar-view-agenda-group">
        
        {/* LEFT COLUMN: SELECTED DATE STATS & TIMELINE PLANNERS (5 slots) */}
        <div className="md:col-span-5 bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-5 shadow-xs flex flex-col gap-4 text-left">
          
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Intent Performance
              </h3>
              <p className="text-sm font-black text-slate-800 tracking-tight font-display mt-0.5">
                {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            {/* Dynamic visual indicator tag */}
            <span className="text-[10px] bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-bold border border-purple-100 flex items-center gap-1">
              <Zap size={10} className="fill-current text-purple-500" />
              <span>{selectedDateTasks.length} Scheduled</span>
            </span>
          </div>

          {/* Progress circle for target day */}
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    className="stroke-slate-200 fill-transparent"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="22"
                    className="stroke-violet-600 fill-transparent stroke-linecap-round"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 22}
                    initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 22) * (1 - (selectedCompletedRatio / 100)) }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <span className="absolute text-[11px] font-mono font-black text-slate-800">
                  {Math.round(selectedCompletedRatio)}%
                </span>
              </div>

              <div>
                <p className="text-[11px] text-slate-700 font-bold leading-none">Complete Target Routine</p>
                <p className="text-[10px] text-slate-400 mt-1 lines-clamp-2 leading-relaxed font-medium">
                  {selectedDateTasks.filter(t => t.completed).length} of {selectedDateTasks.length} target items completed on this day.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Schedule Button bar */}
          <button
            onClick={() => triggerOpenAddModal(selectedDateStr)}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-xs font-black tracking-wide uppercase transition-all shadow-tiny cursor-pointer hover:opacity-95 flex items-center justify-center gap-1.5"
            id="agenda-add-event-btn"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Schedule Event / Task</span>
          </button>
        </div>

        {/* RIGHT COLUMN: LIST OF CHRONOLOGICAL EVENTS (7 slots) */}
        <div className="md:col-span-7 flex flex-col gap-3 text-left">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono flex items-center gap-1.5 leading-none">
              <ListTodo size={13} className="text-violet-600" /> Planned Timetable Agenda
            </h4>
            <span className="text-[9px] font-mono text-slate-400 font-bold select-none">[Draggable Items]</span>
          </div>

          <div className="flex flex-col gap-2.5" id="calendar-timeline-items">
            {selectedDateTasks.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {selectedDateTasks.map((todo) => {
                  const isCompleted = todo.completed;

                  return (
                    <motion.div
                      key={todo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, todo.id)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileDrag={{ scale: 1.03, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                      className={`p-4 rounded-2xl border transition-all cursor-move relative flex items-start gap-3.5 group select-none ${
                        isCompleted 
                          ? 'bg-slate-50/70 border-slate-100/90' 
                          : 'bg-white border-slate-100 hover:border-slate-300 shadow-tiny'
                      }`}
                    >
                      {/* Checkbox trigger */}
                      <button
                        onClick={() => {
                          onToggleTodo(todo.id);
                          triggerSoundFeedback(isCompleted ? 400 : 700, 'sine', 0.1);
                        }}
                        className="mt-0.5 shrink-0 hover:scale-110 active:scale-95 transition-all text-slate-300 hover:text-slate-500 cursor-pointer"
                      >
                        {isCompleted ? (
                          <span className="text-violet-600">
                            <CheckCircle2 size={18} className="fill-current stroke-white" />
                          </span>
                        ) : (
                          <Circle size={18} strokeWidth={2.2} />
                        )}
                      </button>

                      {/* Content details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`text-xs font-bold leading-snug truncate ${
                            isCompleted ? 'text-slate-400 line-through font-normal' : 'text-slate-800'
                          }`}>
                            {todo.title}
                          </h4>
                          
                          {/* Priority Ribbon */}
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-1 shadow-xs ${PRIORITY_COLOR_MAP[todo.priority]}`} />
                        </div>

                        {todo.description && (
                          <p className={`text-[10px] mt-1 pr-3 leading-normal ${
                            isCompleted ? 'text-slate-400/70' : 'text-slate-500 font-medium'
                          }`}>
                            {todo.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {/* Category Tag badge */}
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/40">
                            <span>{CATEGORY_ICONS[todo.category] || '🎯'}</span>
                            <span>{todo.category}</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold capitalize border border-rose-100">
                            <span>{todo.priority} priority</span>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <div 
                className="border border-dashed border-slate-200 rounded-3xl py-11 px-5 text-center flex flex-col items-center justify-center gap-2 bg-slate-50/20"
                onDragOver={(e) => handleDragOverCell(e, selectedDateStr)}
                onDragLeave={handleDragLeaveCell}
                onDrop={(e) => handleDropOnCell(e, selectedDateStr)}
                id="timeline-drag-drop-empty-target"
              >
                <div className="p-3 bg-white rounded-full shadow-3xs text-slate-300">
                  <Inbox size={22} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">No scheduled activities</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal max-w-xs">
                    Create an event or simply **drag any task** from another source and drop them right here onto this empty region!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {/* 🔮 PREMIUM MODAL: CREATE NEW SCHEDULED EVENT ( frosted background ) */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full border border-slate-150 relative text-left"
              id="event-planner-dialog-card"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>

              <div className="flex items-center gap-2 pb-2.5 mb-4 border-b border-slate-100">
                <CalendarIcon size={16} className="text-violet-600" />
                <h3 className="text-sm font-black text-slate-800 tracking-tight font-display">
                  Schedule New Routine Entry
                </h3>
              </div>

              <form onSubmit={handleCreateEvent} className="flex flex-col gap-3.5">
                {/* Title */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Wellness Sync, Design Review"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-100 font-semibold bg-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                    Context / Notes
                  </label>
                  <textarea
                    placeholder="Brief cues, instructions, or hyperlinks..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-100 font-medium bg-white lg:resize-none"
                  />
                </div>

                {/* Selection Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 outline-none"
                    >
                      <option value="Personal">🏠 Personal</option>
                      <option value="Work">💼 Work</option>
                      <option value="Wellness">🧘 Wellness</option>
                      <option value="Shopping">🛒 Shopping</option>
                      <option value="Urgent">🔥 Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                      Priority Level
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 outline-none"
                    >
                      <option value="low">🟡 Low Prior</option>
                      <option value="medium">🟠 Medium Prior</option>
                      <option value="high">🔴 High Prior</option>
                    </select>
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                    Schedule Date Address
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-100 font-bold text-slate-700 bg-white"
                  />
                </div>

                {/* Event creation Submit row */}
                <div className="grid grid-cols-2 gap-3 mt-3.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-tiny"
                  >
                    Establish Schedule
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
