import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  RefreshCcw, 
  Zap, 
  AlertCircle,
  HelpCircle,
  BookOpen,
  MousePointerClick
} from 'lucide-react';
import { Todo, Habit, Note } from '../types';

interface AIPlannerWidgetProps {
  todos: Todo[];
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  accentColor: string;
}

interface TomorrowTask {
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

interface StudySession {
  title: string;
  description?: string;
  duration: number;
  time: string;
  priority: 'low' | 'medium' | 'high';
}

interface WeeklyRecommendation {
  title: string;
  tip: string;
  metricReason: string;
}

interface PlanData {
  tomorrowTasks: TomorrowTask[];
  studySessions: StudySession[];
  productivityInsights: string[];
  weeklyRecommendations: WeeklyRecommendation[];
}

export default function AIPlannerWidget({
  todos,
  onAddTodo,
  accentColor
}: AIPlannerWidgetProps) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [addedTasks, setAddedTasks] = useState<Record<string, boolean>>({});
  const [scheduledSessions, setScheduledSessions] = useState<Record<string, boolean>>({});

  // Today static pivot
  const todayStr = '2026-06-19';
  const tomorrowStr = '2026-06-20';

  // Load cache on mount
  useEffect(() => {
    const cached = localStorage.getItem('cached_ai_planner_data');
    if (cached) {
      try {
        setPlan(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached plan", e);
      }
    }
  }, []);

  // Fetch AI Plan
  const generateAIPlan = async () => {
    setLoading(true);
    setError(null);
    setAddedTasks({});
    setScheduledSessions({});

    // Read full context safely
    let habits: Habit[] = [];
    let notes: Note[] = [];
    let focusMinutes = 0;
    
    try {
      const storedHabits = localStorage.getItem('premium_habits_store');
      if (storedHabits) habits = JSON.parse(storedHabits);

      const storedNotes = localStorage.getItem('organizer_notes');
      if (storedNotes) notes = JSON.parse(storedNotes);

      const storedSessions = localStorage.getItem('completed_focus_sessions');
      if (storedSessions) {
        const parsed = JSON.parse(storedSessions);
        // Calculate focus minutes for 2026-06-19
        focusMinutes = parsed
          .filter((s: any) => s.completedAt?.split('T')[0] === todayStr && s.type === 'focus')
          .reduce((sum: number, curr: any) => sum + curr.minutes, 0);
      }
    } catch (e) {
      console.error("Context load error during planning initialization:", e);
    }

    // Calculate score matching DashboardView
    const completedToday = todos.filter(t => t.completed && (!t.dueDate || t.dueDate === todayStr)).length;
    const totalToday = todos.length;
    const taskRate = totalToday > 0 ? (completedToday / totalToday) : 1.0;
    const totalHabits = habits.length;
    const completedHabits = habits.filter(h => h.history?.[todayStr] === true).length;
    const habitRate = totalHabits > 0 ? (completedHabits / totalHabits) : 1.0;
    const focusContribution = Math.min(focusMinutes / 60, 1.0);
    const weightedSum = (taskRate * 40) + (habitRate * 40) + (focusContribution * 20);
    const calculatedScore = Math.min(Math.round(weightedSum), 100);

    try {
      const response = await fetch('/api/gemini/planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          todos,
          habits,
          notes,
          focusMinutes,
          productivityScore: calculatedScore
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate AI planner details. Server replied: ${response.status}`);
      }

      const data = await response.json();
      setPlan(data);
      localStorage.setItem('cached_ai_planner_data', JSON.stringify(data));
      
      // Try to play positive subtle high beep feedback if Audio API exists and is legal
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.17);
        }
      } catch (ae) {}

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong while designing your schedule. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = (task: TomorrowTask, index: number) => {
    // Prevent double adding
    if (addedTasks[index]) return;

    onAddTodo({
      title: task.title,
      description: task.description || "Suggested by your AI Copilot Planner.",
      completed: false,
      category: task.category,
      priority: task.priority,
      dueDate: tomorrowStr
    });

    setAddedTasks(prev => ({ ...prev, [index]: true }));

    // Small beep feedback
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (_) {}
  };

  const handleScheduleSession = (session: StudySession, index: number) => {
    if (scheduledSessions[index]) return;

    onAddTodo({
      title: `⚡ Study: ${session.title}`,
      description: `${session.description || "Focused auto-scheduled slot suggestion."} (${session.duration} mins meditation/focus block)`,
      completed: false,
      category: 'Work',
      priority: session.priority || 'medium',
      dueDate: tomorrowStr,
      time: session.time // Auto set scheduled time e.g. "14:30"
    });

    setScheduledSessions(prev => ({ ...prev, [index]: true }));

    // Successful scheduled sync audio beep
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(698.46, ctx.currentTime); // F5
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      }
    } catch (_) {}
  };

  // Static fallback preview content to look gorgeous before first AI fetch
  const getPrebuiltFallbackPlan = (): PlanData => ({
    tomorrowTasks: [
      { title: "Review tomorrow's urgent backlog objectives", description: "Clear pre-existing work tasks from backlog list.", category: "Work", priority: "high" },
      { title: "Diaphragmatic breathing and wellness interval", description: "Practice a lofi rhythmic breathing loop to boost productivity index.", category: "Wellness", priority: "low" }
    ],
    studySessions: [
      { title: "Vite & React Architecture Deep Dive", description: "Read project state declarations & practice modular hooks integration.", duration: 45, time: "11:00", priority: "medium" },
      { title: "Data Visualization & SVG Graphing Lab", description: "Consolidate telemetry calculations and render custom bento widgets.", duration: 60, time: "15:30", priority: "high" }
    ],
    productivityInsights: [
      "Your Focus Timer usage has been healthy! Keep pairing guided breathing gaps with intensive focus segments to retain maximum cognitive load.",
      "Your Ritual Habit Streak is solid. Completing a single personal task early in the day elevates your overall Synergy output by 15%."
    ],
    weeklyRecommendations: [
      { title: "Establish a 45-Minute Focus Slate", tip: "Maintain consecutive 45m deep focus blocks, followed strictly by 10m breathing loops.", metricReason: "Aligns with your average study session durations." },
      { title: "Clear the 'Urgent' Backlog Early", tip: "Tether your high-priority items directly inside your Calendar Planner by 10:00 AM.", metricReason: "High-priority items remain unchecked in afternoon slots." }
    ]
  });

  const activePlan = plan || getPrebuiltFallbackPlan();

  return (
    <div className="flex flex-col gap-4 text-left" id="ai-planner-wrapper">
      
      {/* 🚀 AI BANNER HERO */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/20 text-white relative overflow-hidden shadow-md">
        {/* Soft floating particles / decorative visual indicators */}
        <div className="absolute right-[-10px] top-[-10px] w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
        <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-[10px] font-bold tracking-wider text-indigo-300 uppercase font-mono mb-2">
              <Sparkles size={11} className="text-indigo-400 animate-spin" style={{ animationDuration: '3s' }} />
              Active AI Copilot
            </div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              Deep Planner Workspace
            </h2>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-sm leading-relaxed">
              Connect your real task history, active memos, pomodoro completions, and habits with Gemini to generate custom study sessions and productivity tactics.
            </p>
          </div>

          <button
            onClick={generateAIPlan}
            disabled={loading}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed border border-white/5 active:scale-97 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCcw size={13} className="animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <RefreshCcw size={13} />
                <span>Sync with AI Coach</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        /* LOADING SKELETON RENDER */
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800 p-8 text-center flex flex-col items-center justify-center gap-4 py-16">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-violet-100 dark:border-purple-950 rounded-full" />
            <div className="absolute inset-0 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <Sparkles size={18} className="text-violet-600 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Reconstructing Synergy Models</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed font-semibold">
              Gemini is digesting your task backlog, habit cycles, and notes to compile tomorrow's ideal focus itinerary...
            </p>
          </div>
        </div>
      ) : (
        /* MAIN LIST IN INTERACTION MODE */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* COLUMN 1: SUGGESTED TOMORROW TASKS & STUDY SESS */}
          <div className="md:col-span-12 flex flex-col gap-4">
            
            {/* SUGGESTED TOMORROW TASKS */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/60 p-5 rounded-3xl text-left shadow-2xs">
              <div className="flex justify-between items-center mb-4 border-b border-dashed border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-1.5 bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 rounded-lg text-xs font-mono font-bold">1</div>
                  <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">Suggested Tomorrow Tasks</h3>
                </div>
                <span className="text-[9px] font-mono text-slate-400 font-semibold tracking-wide">Target: {tomorrowStr}</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {activePlan.tomorrowTasks.map((task, idx) => {
                  const added = addedTasks[idx];

                  return (
                    <div 
                      key={idx}
                      className="flex items-start justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-950/20 hover:border-slate-200 dark:hover:border-slate-800 transition-all gap-3"
                    >
                      <div className="flex flex-col gap-1 min-w-0 flex-1 text-left">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                            {task.category}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            task.priority === 'high' 
                              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400'
                          }`}>
                            {task.priority} prioridad
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{task.description}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddTask(task, idx)}
                        disabled={added}
                        className={`p-2.5 rounded-xl border flex items-center gap-1 transition-all text-[10px] font-extrabold cursor-pointer h-8 shrink-0 ${
                          added
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                            : 'bg-white dark:bg-slate-900 border-slate-250 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 active:scale-95'
                        }`}
                      >
                        {added ? (
                          <>
                            <CheckCircle size={12} className="text-emerald-500 fill-transparent" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus size={12} />
                            <span>Adopt</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AUTO SCHEDULE STUDY SESSIONS */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/60 p-5 rounded-3xl text-left shadow-2xs">
              <div className="flex justify-between items-center mb-4 border-b border-dashed border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 rounded-lg text-xs font-mono font-bold">2</div>
                  <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">Auto Scheduled Study Blocks</h3>
                </div>
                <span className="text-[9px] font-mono text-slate-400 font-semibold tracking-wide">Dynamic Timings</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {activePlan.studySessions.map((session, idx) => {
                  const scheduled = scheduledSessions[idx];

                  return (
                    <div 
                      key={idx}
                      className="flex items-start justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-950/20 hover:border-slate-200 dark:hover:border-slate-800 transition-all gap-3"
                    >
                      <div className="flex flex-col gap-1 min-w-0 flex-1 text-left">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Clock size={9} />
                            <span>{session.time}</span>
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-md bg-violet-600/10 text-[#6C3BFF] dark:text-violet-400">
                            <BookOpen size={9} />
                            <span>{session.duration} mins</span>
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                          ⚡ Study: {session.title}
                        </h4>
                        {session.description && (
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{session.description}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleScheduleSession(session, idx)}
                        disabled={scheduled}
                        className={`p-2.5 rounded-xl border flex items-center gap-1 transition-all text-[10px] font-extrabold cursor-pointer h-8 shrink-0 ${
                          scheduled
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                            : 'bg-white dark:bg-slate-900 border-slate-250 hover:bg-slate-55 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 active:scale-95'
                        }`}
                      >
                        {scheduled ? (
                          <>
                            <CheckCircle size={12} className="text-emerald-500" />
                            <span>Registered</span>
                          </>
                        ) : (
                          <>
                            <Calendar size={12} />
                            <span>Schedule</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PRODUCTIVITY COGNITIVE INSIGHTS */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/60 p-5 rounded-3xl text-left shadow-2xs">
              <div className="flex items-center gap-2 mb-3 border-b border-dashed border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="p-1 px-1.5 bg-emerald-105 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-mono font-bold">3</div>
                <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">Productivity Insights</h3>
              </div>

              <div className="flex flex-col gap-3">
                {activePlan.productivityInsights.map((insight, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <span className="p-1 px-1.5 bg-indigo-50 dark:bg-slate-850 text-indigo-505 dark:text-indigo-400 text-[10px] font-mono rounded-lg mt-0.5 shrink-0 select-none">
                      #{idx + 1}
                    </span>
                    <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-medium">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* WEEKLY RECOMMENDATIONS */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/60 p-5 rounded-3xl text-left shadow-2xs">
              <div className="flex items-center gap-2 mb-3.5 border-b border-dashed border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="p-1 px-1.5 bg-[#6C3BFF]/10 text-[#6C3BFF] dark:text-violet-300 rounded-lg text-xs font-mono font-bold">4</div>
                <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">Weekly Recommendations</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activePlan.weeklyRecommendations.map((rec, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-2xl bg-gradient-to-tr from-slate-500/5 to-slate-500/0 dark:from-slate-850/30 border border-slate-100 dark:border-slate-850 text-left flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap size={13} className="text-amber-500 animate-pulse" />
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{rec.title}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                      💡 {rec.tip}
                    </p>
                    {rec.metricReason && (
                      <p className="text-[9px] text-[#6C3BFF]/80 dark:text-violet-400 font-mono mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 border-dashed">
                        Reason: {rec.metricReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
