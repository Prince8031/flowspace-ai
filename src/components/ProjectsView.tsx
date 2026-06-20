import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderGit2, 
  Plus, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Kanban, 
  ArrowLeft, 
  Sparkles, 
  Briefcase, 
  Flame, 
  Check,
  ChevronRight,
  ListTodo,
  AlertCircle
} from 'lucide-react';
import { Project, ProjectTask } from '../types';

interface ProjectsViewProps {
  accentColor: string;
}

const PRESET_COLUMNS: { id: 'todo' | 'progress' | 'review' | 'done'; title: string; color: string; bg: string }[] = [
  { id: 'todo', title: 'To Do', color: 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800', bg: 'bg-slate-50/50 dark:bg-slate-950/20' },
  { id: 'progress', title: 'In Progress', color: 'text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-950/30', bg: 'bg-indigo-50/10 dark:bg-indigo-950/10' },
  { id: 'review', title: 'In Review', color: 'text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-950/30', bg: 'bg-amber-50/10 dark:bg-amber-950/10' },
  { id: 'done', title: 'Completed', color: 'text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-950/30', bg: 'bg-emerald-50/10 dark:bg-emerald-950/10' }
];

const LIGHT_ACCENT_TEXT: Record<string, string> = {
  indigo: 'text-indigo-600 dark:text-indigo-400',
  rose: 'text-rose-500 dark:text-rose-400',
  emerald: 'text-emerald-500 dark:text-emerald-400',
  amber: 'text-amber-500 dark:text-amber-400',
  sky: 'text-sky-400 dark:text-sky-400',
  violet: 'text-violet-600 dark:text-violet-400'
};

const ACCENT_BORDER_CLASSES: Record<string, string> = {
  indigo: 'border-indigo-600/30 focus:border-indigo-600',
  rose: 'border-rose-500/30 focus:border-rose-500',
  emerald: 'border-emerald-500/30 focus:border-emerald-500',
  amber: 'border-amber-500/30 focus:border-amber-500',
  sky: 'border-sky-400/30 focus:border-sky-400',
  violet: 'border-violet-600/30 focus:border-violet-600'
};

const ACCENT_BG_CLASSES: Record<string, string> = {
  indigo: 'bg-indigo-500',
  rose: 'bg-rose-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-450',
  violet: 'bg-violet-600'
};

const DEFAULT_PROJECT_SEED: Project[] = [
  {
    id: 'proj-1',
    title: 'Zen Web Platform v2',
    description: 'Sketch elegant glassmorphic layouts, adjust oscillator frequencies for sound chimes, and build real database backup systems.',
    status: 'active',
    deadline: '2026-07-15',
    progress: 50,
    color: 'indigo',
    category: 'Development',
    tasks: [
      { id: 't-1-1', title: 'Implement beautiful sound chimes using Web Audio API', completed: true, status: 'done' },
      { id: 't-1-2', title: 'Refactor settings page to include Backup Export', completed: true, status: 'done' },
      { id: 't-1-3', title: 'Build modern Project kanban and progress board', completed: false, status: 'progress' },
      { id: 't-1-4', title: 'Optimise layout transitions and tab selections', completed: false, status: 'todo' }
    ]
  },
  {
    id: 'proj-2',
    title: 'Brand Refresh & Assets Pack',
    description: 'Design fresh vector graphics, pairings of bold display fonts, and eye-friendly slate twilight templates.',
    status: 'planning',
    deadline: '2026-08-01',
    progress: 25,
    color: 'violet',
    category: 'Marketing',
    tasks: [
      { id: 't-2-1', title: 'Research typography pairing (Inter + Grotesk)', completed: true, status: 'done' },
      { id: 't-2-2', title: 'Sketch brand patterns', completed: false, status: 'todo' },
      { id: 't-2-3', title: 'Review mockups with visual director', completed: false, status: 'todo' }
    ]
  },
  {
    id: 'proj-3',
    title: 'Personal Training Journey',
    description: 'Elevate mindfulness indices, log consistency streaks, and set strict pomodoro intervals.',
    status: 'completed',
    deadline: '2026-06-25',
    progress: 100,
    color: 'emerald',
    category: 'Wellness',
    tasks: [
      { id: 't-3-1', title: 'Complete initial 30-day streak tracker challenge', completed: true, status: 'done' },
      { id: 't-3-2', title: 'Build basic muscle-mind connection', completed: true, status: 'done' }
    ]
  }
];

export default function ProjectsView({ accentColor }: ProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Development');
  const [newDeadline, setNewDeadline] = useState('2026-07-20');
  const [newColor, setNewColor] = useState('indigo');
  const [newStatus, setNewStatus] = useState<'active' | 'planning' | 'on_hold'>('active');

  // Task inline insert
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTargetColumn, setNewTaskTargetColumn] = useState<'todo' | 'progress' | 'review' | 'done'>('todo');

  const acousticEnabled = localStorage.getItem('acoustic_chimes_enabled') !== 'false';

  // Load from local storage or seed
  useEffect(() => {
    const saved = localStorage.getItem('organizer_projects');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (err) {
        setProjects(DEFAULT_PROJECT_SEED);
      }
    } else {
      setProjects(DEFAULT_PROJECT_SEED);
      localStorage.setItem('organizer_projects', JSON.stringify(DEFAULT_PROJECT_SEED));
    }
  }, []);

  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('organizer_projects', JSON.stringify(updatedProjects));
  };

  const playChime = (type: 'add' | 'click' | 'delete' | 'success') => {
    if (!acousticEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        if (type === 'add') {
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        } else if (type === 'delete') {
          osc.frequency.setValueAtTime(392, ctx.currentTime); // G4
          osc.frequency.setValueAtTime(293.66, ctx.currentTime + 0.08); // D4
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        } else if (type === 'success') {
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.06); // C6
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        } else {
          osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
          gain.gain.setValueAtTime(0.02, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (_) {}
  };

  // Add Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      status: newStatus,
      deadline: newDeadline || undefined,
      progress: 0,
      color: newColor,
      category: newCategory.trim() || undefined,
      tasks: []
    };

    const nextList = [newProj, ...projects];
    saveProjects(nextList);
    playChime('add');
    
    // reset
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Development');
    setNewColor('indigo');
    setNewStatus('active');
    setShowAddModal(false);
  };

  // Delete Project
  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project? This will erase all its Kanban tasks as well.')) {
      const nextList = projects.filter(p => p.id !== projectId);
      saveProjects(nextList);
      playChime('delete');
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
    }
  };

  // Switch Selected
  const activeProj = projects.find(p => p.id === selectedProjectId);

  // Recalculate progress for a project dynamically when its tasks change
  const recomputeProgress = (tasks: ProjectTask[]): number => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'done' || t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Add Project Task to Kanban Board
  const handleAddKanbanTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProjectId) return;

    const nextProjects = projects.map(proj => {
      if (proj.id === selectedProjectId) {
        const newTask: ProjectTask = {
          id: `t-${Date.now()}`,
          title: newTaskTitle.trim(),
          completed: newTaskTargetColumn === 'done',
          status: newTaskTargetColumn
        };
        const updatedTasks = [...proj.tasks, newTask];
        return {
          ...proj,
          tasks: updatedTasks,
          progress: recomputeProgress(updatedTasks),
          status: recomputeProgress(updatedTasks) === 100 ? 'completed' : proj.status
        };
      }
      return proj;
    });

    saveProjects(nextProjects);
    setNewTaskTitle('');
    playChime('add');
  };

  // Shift Kanban Task to next column / Specific column
  const handleCycleTaskStatus = (taskId: string, targetStatus: 'todo' | 'progress' | 'review' | 'done') => {
    const nextProjects = projects.map(proj => {
      if (proj.id === selectedProjectId) {
        const updatedTasks = proj.tasks.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              status: targetStatus,
              completed: targetStatus === 'done'
            };
          }
          return t;
        });
        const nextProg = recomputeProgress(updatedTasks);
        return {
          ...proj,
          tasks: updatedTasks,
          progress: nextProg,
          status: nextProg === 100 ? 'completed' : proj.status === 'completed' ? 'active' : proj.status
        };
      }
      return proj;
    });

    saveProjects(nextProjects);
    playChime('click');
  };

  // Delete specific Kanban Task
  const handleDeleteKanbanTask = (taskId: string) => {
    const nextProjects = projects.map(proj => {
      if (proj.id === selectedProjectId) {
        const updatedTasks = proj.tasks.filter(t => t.id !== taskId);
        return {
          ...proj,
          tasks: updatedTasks,
          progress: recomputeProgress(updatedTasks),
          status: recomputeProgress(updatedTasks) === 100 && updatedTasks.length > 0 ? 'completed' : proj.status
        };
      }
      return proj;
    });

    saveProjects(nextProjects);
    playChime('delete');
  };

  // Check how many days remaining for visual deadline indicators
  const getDeadlineText = (deadlineStr?: string) => {
    if (!deadlineStr) return { text: 'No milestone set', severity: 'normal' };
    
    try {
      const today = new Date('2026-06-19'); // Anchor date
      const dl = new Date(deadlineStr);
      const diffTime = dl.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: `Overdue by ${Math.abs(diffDays)}d`, severity: 'error' };
      }
      if (diffDays === 0) {
        return { text: 'Due Today', severity: 'warning' };
      }
      if (diffDays <= 3) {
        return { text: `${diffDays}d left urgently`, severity: 'warning' };
      }
      return { text: `${diffDays} days remaining`, severity: 'normal' };
    } catch (_) {
      return { text: deadlineStr, severity: 'normal' };
    }
  };

  const getStatusBadgeStyle = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 text-indigo-700 dark:text-indigo-300';
      case 'completed':
        return 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-300';
      case 'on_hold':
        return 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 text-rose-700 dark:text-rose-300';
      case 'planning':
        return 'bg-slate-50 dark:bg-slate-950/40 border-slate-205 text-slate-500 dark:text-slate-355';
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left" id="projects-view-panel">
      
      <AnimatePresence mode="wait">
        {!activeProj ? (
          /* ========================================= */
          /* 1. PROJECTS MAIN DASHBOARD GRID / OVERVIEW */
          /* ========================================= */
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-5"
          >
            {/* Elegant Header Hero */}
            <div className="p-5.5 rounded-3xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 text-white relative overflow-hidden shadow-sm flex justify-between items-center flex-wrap gap-4">
              <div className="absolute right-[-15px] top-[-15px] w-40 h-40 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 text-left">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-indigo-500/20 text-[9px] font-bold tracking-wider text-indigo-300 uppercase font-mono mb-2">
                  Kanban Ecosystem
                </div>
                <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <FolderGit2 className="text-[#8B5CF6]" size={20} />
                  <span>Interactive Projects</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                  Map milestones, group team scopes, examine deadline margins, and orchestrate Kanban cards in real-time.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowAddModal(true);
                  playChime('click');
                }}
                id="btn-trigger-new-project-modal"
                className="px-4.5 py-2.5 rounded-2xl bg-gradient-to-tr from-[#6C3BFF] to-fuchsia-600 hover:opacity-90 active:scale-95 text-xs font-bold text-white shadow-tiny transition-all cursor-pointer flex items-center gap-1.5 relative z-10"
              >
                <Plus size={14} />
                <span>Create Stage</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2.5" id="project-metrics-bench">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-3.5 shadow-3xs flex flex-col">
                <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest leading-none">Total Tracks</span>
                <span className="text-xl font-extrabold text-slate-850 dark:text-white mt-1">{projects.length}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-3.5 shadow-3xs flex flex-col">
                <span className="text-[9px] font-mono font-black text-indigo-500 uppercase tracking-widest leading-none">In-Flight</span>
                <span className="text-xl font-extrabold text-[#6C3BFF] mt-1">
                  {projects.filter(p => p.status === 'active').length}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-3.5 shadow-3xs flex flex-col">
                <span className="text-[9px] font-mono font-black text-emerald-500 uppercase tracking-widest leading-none">Completed</span>
                <span className="text-xl font-extrabold text-emerald-500 mt-1">
                  {projects.filter(p => p.status === 'completed').length}
                </span>
              </div>
            </div>

            {/* Project Cards Grid */}
            {projects.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-205 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-55/10 text-indigo-500">
                  <ListTodo size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">No Projects Seeded</h3>
                <p className="text-xs text-slate-400 max-w-xs">Create your very first project framework manually to launch a personalized interactive Kanban Board.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 mt-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer z-10"
                >
                  Create Project Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="project-dashboard-cards-grid">
                {projects.map((proj) => {
                  const deadlineInfo = getDeadlineText(proj.deadline);
                  const totalTasks = proj.tasks.length;
                  const completedTasks = proj.tasks.filter(t => t.status === 'done' || t.completed).length;

                  return (
                    <motion.div
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        playChime('click');
                      }}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-5 shadow-3xs hover:shadow-xs cursor-pointer transition-all hover:scale-[1.01] overflow-hidden relative flex flex-col justify-between group"
                      id={`project-card-${proj.id}`}
                    >
                      {/* Decorative colored margin edge */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1 ${ACCENT_BG_CLASSES[proj.color] || 'bg-[#6C3BFF]'}`} />

                      <div>
                        {/* Status + Category Row */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] font-black tracking-wider text-slate-400 font-mono uppercase">
                            {proj.category || 'General'}
                          </span>
                          
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold font-mono uppercase tracking-wide border ${getStatusBadgeStyle(proj.status)}`}>
                            {proj.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Title & Desc */}
                        <h3 className="text-sm font-extrabold text-slate-850 dark:text-white group-hover:text-[#6C3BFF] transition-colors leading-snug">
                          {proj.title}
                        </h3>
                        {proj.description && (
                          <p className="text-xs text-slate-400 dark:text-slate-355 mt-1.5 leading-relaxed line-clamp-2">
                            {proj.description}
                          </p>
                        )}
                      </div>

                      {/* Progress Bar Bench */}
                      <div className="mt-5 pt-3.5 border-t border-dashed border-slate-100 dark:border-slate-850/60">
                        <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
                          <div className="flex items-center gap-1 text-slate-500">
                            <CheckCircle2 size={11} className="text-emerald-500" />
                            <span>{completedTasks}/{totalTasks} Task Units</span>
                          </div>
                          <span className="font-mono text-slate-700 dark:text-slate-205">{proj.progress}%</span>
                        </div>

                        {/* Visual Progress Track */}
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${ACCENT_BG_CLASSES[proj.color] || 'bg-[#6C3BFF]'}`} 
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>

                        {/* Deadline Row */}
                        <div className="flex justify-between items-center mt-3 text-[10px]">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock size={11} />
                            <span className={
                              deadlineInfo.severity === 'error' 
                                ? 'text-rose-500 font-extrabold' 
                                : deadlineInfo.severity === 'warning' 
                                ? 'text-amber-500 font-extrabold' 
                                : ''
                            }>
                              {deadlineInfo.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 hover:translate-x-0.5 transition-transform text-[#6C3BFF] font-black text-[9px] uppercase tracking-wider font-mono">
                            <span>Board</span>
                            <ChevronRight size={10} className="stroke-[3px]" />
                          </div>
                        </div>
                      </div>

                      {/* Absolute delete click button */}
                      <button
                        onClick={(e) => handleDeleteProject(proj.id, e)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 dark:text-slate-700 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                        title="Delete this project"
                        id={`delete-project-button-${proj.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* ========================================= */
          /* 2. DEDICATED PROJECT KANBAN BOARD VIEW     */
          /* ========================================= */
          <motion.div
            key="kanban-board"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Header / Navigation back bar */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 h-11">
              <button
                onClick={() => {
                  setSelectedProjectId(null);
                  playChime('click');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-transform hover:-translate-x-0.5 active:scale-95"
                id="back-to-projects-dashboard"
              >
                <ArrowLeft size={13} />
                <span>Sandbox Grid</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${ACCENT_BG_CLASSES[activeProj.color] || 'bg-[#6C3BFF]'} border`} />
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#6C3BFF] dark:text-indigo-400 mb-0.5">
                  {activeProj.category || 'General'} Project
                </span>
              </div>
            </div>

            {/* Project card stats overview inside board */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-[28px] p-5 shadow-3xs text-left relative overflow-hidden flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <h2 className="text-base font-black text-slate-850 dark:text-white leading-tight">
                    {activeProj.title}
                  </h2>
                  {activeProj.description && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-355 leading-relaxed mt-1.5 max-w-xl">
                      {activeProj.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold font-mono tracking-wide border uppercase ${getStatusBadgeStyle(activeProj.status)}`}>
                    {activeProj.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Progress Bench */}
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 font-mono mt-1 border-t border-dashed border-slate-100 dark:border-slate-850/60 pt-3 flex-wrap gap-2">
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar size={11} className="text-indigo-500" />
                  <span>Due: {activeProj.deadline || 'No expiry'}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-emerald-500 font-black uppercase tracking-wider">
                    {activeProj.tasks.filter(t => t.status === 'done' || t.completed).length}/{activeProj.tasks.length} Completed
                  </span>
                  <span className="text-slate-700 dark:text-slate-205 mt-0.5 font-extrabold">{activeProj.progress}% Done</span>
                </div>
              </div>

              {/* Progress visual track */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${ACCENT_BG_CLASSES[activeProj.color] || 'bg-[#6C3BFF]'}`} 
                  style={{ width: `${activeProj.progress}%` }}
                />
              </div>
            </div>

            {/* Quick adding sub-task form inline to columns */}
            <form 
              onSubmit={handleAddKanbanTask}
              className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-850 flex gap-2"
              id="quick-add-kanban-task-form"
            >
              <input
                type="text"
                placeholder="Compose a new Kanban item..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              
              <select
                value={newTaskTargetColumn}
                onChange={(e) => setNewTaskTargetColumn(e.target.value as any)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="todo">To Do</option>
                <option value="progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Completed</option>
              </select>

              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-[#6C3BFF] hover:bg-violet-500 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center"
              >
                <Plus size={13} />
              </button>
            </form>

            {/* KANBAN BOARD 4-COLUMN LANE GRID */}
            <div 
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start overflow-x-auto select-none py-1 pb-16"
              id="kanban-lanes-bench"
            >
              {PRESET_COLUMNS.map((col) => {
                const columnTasks = activeProj.tasks.filter(t => t.status === col.id);
                
                return (
                  <div 
                    key={col.id}
                    className={`rounded-2xl border p-2.5 flex flex-col gap-2 min-h-[220px] transition-all ${col.bg} ${col.color}`}
                    id={`kanban-column-card-${col.id}`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850/60 pb-1.5 px-1">
                      <span className="text-[10px] font-black uppercase font-mono tracking-wider leading-none">
                        {col.title}
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-white dark:bg-slate-900 shadow-3xs border border-transparent dark:border-slate-800 px-1.5 py-0.5 rounded-md leading-none text-slate-400">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Draggable-like cycle card list */}
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[440px] pr-0.5">
                      {columnTasks.length === 0 ? (
                        <div className="py-6 text-center text-[10px] text-slate-400/80 font-mono select-none">
                          No items in lane
                        </div>
                      ) : (
                        columnTasks.map((t) => (
                          <motion.div
                            key={t.id}
                            layoutId={`kanban-card-${t.id}`}
                            className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850/90 rounded-2xl p-3 shadow-3xs relative group flex flex-col gap-2 justify-between cursor-default"
                          >
                            <span 
                              className={`text-[11px] font-bold tracking-tight leading-normal text-slate-805 dark:text-slate-100 ${
                                t.status === 'done' ? 'line-through text-slate-400 dark:text-slate-500' : ''
                              }`}
                            >
                              {t.title}
                            </span>

                            {/* Kanban Control Actions (Cycle through lanes) */}
                            <div className="flex items-center justify-between border-t border-dashed border-slate-50 dark:border-slate-850 pt-2 mt-1 gap-1 flex-wrap">
                              {/* Task Deletion */}
                              <button
                                onClick={() => handleDeleteKanbanTask(t.id)}
                                className="p-1 rounded bg-slate-50 dark:bg-slate-950 border border-transparent hover:border-rose-200 hover:text-rose-500 text-slate-300 dark:text-slate-750 transition-all cursor-pointer flex items-center justify-center shrink-0"
                                title="Delete task"
                              >
                                <Trash2 size={10} />
                              </button>

                              {/* Target column shift triggers (Acoustic indicators built-in) */}
                              <div className="flex gap-0.5">
                                {PRESET_COLUMNS.filter(c => c.id !== col.id).map((c) => (
                                  <button
                                    key={c.id}
                                    onClick={() => handleCycleTaskStatus(t.id, c.id)}
                                    className={`px-1.5 py-0.5 text-[8px] font-mono font-black border uppercase rounded-md transition-all cursor-pointer ${
                                      c.id === 'done' 
                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white border-emerald-150' 
                                        : c.id === 'progress'
                                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-500 hover:text-white border-indigo-150'
                                        : c.id === 'review'
                                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white border-amber-150'
                                        : 'bg-slate-50 text-slate-650 hover:bg-slate-500 hover:text-white border-slate-150'
                                    }`}
                                    title={`Shift to ${c.title}`}
                                  >
                                    {c.title.split(' ').pop()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MODERN MODAL: CREATE NEW PROJECT PRESET */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4" id="add-project-modal-mask">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-2xl max-w-sm w-full text-left relative overflow-hidden"
              id="add-project-modal-card"
            >
              <div className="absolute right-[-15px] top-[-15px] w-28 h-28 bg-[#6C3BFF]/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-850 pb-3" id="add-project-modal-header">
                <div className="p-1.5 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-[#6C3BFF]">
                  <Sparkles size={14} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase font-mono tracking-widest text-[#6C3BFF] dark:text-indigo-400">Assemble Milestone</h3>
                  <p className="text-[10px] text-slate-400">Launch a brand new Kanban project</p>
                </div>
              </div>

              <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
                {/* Title */}
                <div className="text-left">
                  <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1">
                    Board Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zen Meditation Portal"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Sub-text Description */}
                <div>
                  <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1">
                    Purpose / Summary Description
                  </label>
                  <textarea
                    placeholder="High-fidelity visual concepts..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-indigo-500 focus:outline-none transition-all resize-none"
                  />
                </div>

                {/* Grid Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1">
                      Sector Category
                    </label>
                    <input
                      type="text"
                      placeholder="Development, Life..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200  dark:border-slate-850 rounded-xl focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1">
                      Final Target Deadline
                    </label>
                    <input
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1">
                      Initial Stage Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="planning">📋 Planning</option>
                      <option value="active">⚡ Active</option>
                      <option value="on_hold">🛑 On Hold</option>
                    </select>
                  </div>

                  {/* Highlight core color */}
                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1">
                      Visual Highlight
                    </label>
                    <div className="flex gap-1.5 mt-2" id="new-project-color-pickers">
                      {['indigo', 'rose', 'emerald', 'amber', 'violet'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setNewColor(col)}
                          className={`w-4 h-4 rounded-full ${ACCENT_BG_CLASSES[col] || 'bg-indigo-500'} border transition-transform cursor-pointer ${
                            newColor === col ? 'scale-125 ring-2 ring-indigo-550' : 'hover:scale-110'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      playChime('click');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-150 dark:border-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 text-xs font-semibold cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#6C3BFF] hover:bg-violet-700 text-white text-xs font-bold transition-all cursor-pointer text-center shadow-tiny"
                  >
                    Launch Board
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
