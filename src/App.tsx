/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2,
  Calendar,
  Sparkles,
  Layers,
  Inbox,
  User,
  Sliders,
  Smartphone,
  Check,
  Award,
  BookOpen,
  ClipboardList,
  StickyNote,
  Settings,
  Timer,
  Heart,
  TrendingUp,
  FolderGit2,
  Plus,
  Flame,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Todo, Note, UserProfile, Habit } from './types';
import DashboardView from './components/DashboardView';
import NotesView from './components/NotesView';
import SettingsView from './components/SettingsView';
import CalendarView from './components/CalendarView';
import TimerView from './components/TimerView';
import HabitsView from './components/HabitsView';
import StatsView from './components/StatsView';
import ProfileView from './components/ProfileView';
import ProjectsView from './components/ProjectsView';
import AnimatedBackground from './components/AnimatedBackground';
import AuraAssistantView from './components/AuraAssistantView';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  fetchCloudData, 
  saveCloudData, 
  CloudData 
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';


// Preset Warm Accent Names
const ACCENT_COLOR_CLASSES: Record<string, string> = {
  indigo: 'from-indigo-600 to-violet-600',
  rose: 'from-rose-500 to-pink-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  sky: 'from-sky-400 to-blue-500',
  violet: 'from-violet-600 to-purple-600'
};

const ACCENT_BORDER_CLASSES: Record<string, string> = {
  indigo: 'border-indigo-600 text-indigo-600',
  rose: 'border-rose-500 text-rose-500',
  emerald: 'border-emerald-500 text-emerald-500',
  amber: 'border-amber-500 text-amber-500',
  sky: 'border-sky-500 text-sky-500',
  violet: 'border-violet-600 text-violet-600'
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Prince Kumar',
  avatar: '🚀',
  dailyGoal: 3,
  accentColor: 'indigo',
  showCompleted: true
};

const DEFAULT_TODOS: Todo[] = [
  {
    id: 'demo-1',
    title: 'Design high-fidelity task onboarding dashboard',
    description: 'Sketch layout concepts for our mobile scheduler, including a sticky notes area.',
    completed: true,
    category: 'Work',
    priority: 'high',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  },
  {
    id: 'demo-2',
    title: 'Restock daily pantry & organic grocery items',
    description: 'Get almond milk, sugarless organic granola, fresh avocados, and lavender tea bags.',
    completed: false,
    category: 'Shopping',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    dueDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'demo-3',
    title: 'Complete guided breathing & diaphragmatic loop',
    description: 'Practice 10 minutes of deep meditation to restore cognitive focus.',
    completed: false,
    category: 'Wellness',
    priority: 'low',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Weekend Travel Checklist',
    content: '- Wear comfortable walking shoes\n- Download offline navigation maps\n- Bring multi-port rapid charger\n- Pack sunglasses & rain umbrella',
    color: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    isPinned: true
  },
  {
    id: 'note-2',
    title: 'Inspiring Project Quotes',
    content: '"Simplicity is subtractive. Subtract the secondary details to amplify what truly serves the objective."',
    color: 'bg-amber-50 border-amber-200 text-amber-900',
    createdAt: new Date().toISOString(),
    isPinned: false
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'habits' | 'timer' | 'calendar' | 'projects' | 'stats' | 'notes' | 'settings' | 'profile' | 'aura'>('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  
  // App state
  const [todos, setTodos] = useState<Todo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // --- Firebase Auth & Cloud Sync State engine ---
  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);


  // Quick Capture modal & form states
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [qcTab, setQcTab] = useState<'todo' | 'note' | 'habit' | 'event'>('todo');
  const [qcTitle, setQcTitle] = useState('');
  const [qcContent, setQcContent] = useState('');
  const [qcCategory, setQcCategory] = useState('Personal');
  const [qcDate, setQcDate] = useState('');
  const [qcUrgent, setQcUrgent] = useState(false);

  // FAB Menu expanded states
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [qcHabitColor, setQcHabitColor] = useState('violet');
  const [qcHabitFrequency, setQcHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [qcEventTime, setQcEventTime] = useState('');
  const [qcEventLocation, setQcEventLocation] = useState('');

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('premium_dark_mode') === 'true';
  });

  // --- Progressive Web App (PWA) and Offline State Engine ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    }
    return false;
  });
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [showOfflineToast, setShowOfflineToast] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      console.log('[FlowSpace PWA] Standalone App installed successfully!');
    };

    const handleOnlineStatus = () => {
      setIsOffline(false);
      setShowOfflineToast(true);
      setTimeout(() => setShowOfflineToast(false), 4000);
    };

    const handleOfflineStatus = () => {
      setIsOffline(true);
      setShowOfflineToast(true);
      setTimeout(() => setShowOfflineToast(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);

  const handleInstallAppInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[FlowSpace PWA] Standard PWA Install Trigger chosen: ${outcome}`);
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Splash Screen auto-dismiss timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('premium_dark_mode', String(isDarkMode));
    const isDark = isDarkMode;
    if (isDark) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const storedTodos = localStorage.getItem('organizer_todos');
      const storedNotes = localStorage.getItem('organizer_notes');
      const storedProfile = localStorage.getItem('organizer_profile');
      const storedHabits = localStorage.getItem('premium_habits_store');

      if (storedTodos) {
        setTodos(JSON.parse(storedTodos));
      } else {
        setTodos(DEFAULT_TODOS);
      }

      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      } else {
        setNotes(DEFAULT_NOTES);
      }

      if (storedHabits) {
        setHabits(JSON.parse(storedHabits));
      }

      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed.name === 'Alex' || !parsed.name || parsed.name === 'Prince' || parsed.name === 'Prince kumar' || parsed.name === 'Amelia') {
          parsed.name = 'Prince Kumar';
          setProfile(parsed);
          localStorage.setItem('organizer_profile', JSON.stringify(parsed));
        } else {
          setProfile(parsed);
        }
      } else {
        const initial = { ...DEFAULT_PROFILE, name: 'Prince Kumar' };
        setProfile(initial);
        localStorage.setItem('organizer_profile', JSON.stringify(initial));
      }
    } catch (e) {
      console.error("Failed loading persistent states:", e);
      setTodos(DEFAULT_TODOS);
      setNotes(DEFAULT_NOTES);
      setProfile(DEFAULT_PROFILE);
    }
  }, []);

  // Sync habits state whenever activeTab shifts
  useEffect(() => {
    try {
      const storedHabits = localStorage.getItem('premium_habits_store');
      if (storedHabits) {
        setHabits(JSON.parse(storedHabits));
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeTab]);

  // Sync state helpers
  const saveTodos = (updated: Todo[]) => {
    setTodos(updated);
    localStorage.setItem('organizer_todos', JSON.stringify(updated));
  };

  const saveNotes = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem('organizer_notes', JSON.stringify(updated));
  };

  const saveProfile = (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem('organizer_profile', JSON.stringify(updated));
  };

  // State handlers - Todos
  const handleToggleTodo = (id: string) => {
    const updated = todos.map(todo => {
      if (todo.id === id) {
        const nextCompleted = !todo.completed;
        const nextSubtasks = todo.subtasks?.map(st => ({ ...st, completed: nextCompleted }));
        return { 
          ...todo, 
          completed: nextCompleted, 
          subtasks: nextSubtasks 
        };
      }
      return todo;
    });
    saveTodos(updated);
  };

  const handleUpdateTodo = (id: string, updatedFields: Partial<Todo>) => {
    const updated = todos.map(todo => {
      if (todo.id === id) {
        return { ...todo, ...updatedFields };
      }
      return todo;
    });
    saveTodos(updated);
  };

  const handleAddTodo = (newTodo: Omit<Todo, 'id' | 'createdAt'>) => {
    const todoWithId: Todo = {
      ...newTodo,
      id: `todo-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    saveTodos([todoWithId, ...todos]);
  };

  const handleDeleteTodo = (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    saveTodos(updated);
  };

  // State handlers - Notes
  const handleAddNote = (newNote: Omit<Note, 'id' | 'createdAt'>) => {
    const noteWithId: Note = {
      ...newNote,
      id: `note-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    saveNotes([noteWithId, ...notes]);
  };

  const handleAddHabit = (newHabit: Omit<Habit, 'id' | 'createdAt'>) => {
    const createdHabit: Habit = {
      ...newHabit,
      id: `habit-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    const updated = [createdHabit, ...habits];
    setHabits(updated);
    localStorage.setItem('premium_habits_store', JSON.stringify(updated));
  };

  const handleEditNote = (id: string, updatedFields: Partial<Note>) => {
    const updated = notes.map(n => {
      if (n.id === id) {
        return { ...n, ...updatedFields };
      }
      return n;
    });
    saveNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
  };

  // Profile update
  const handleUpdateProfile = (updatedFields: Partial<UserProfile>) => {
    const updated = { ...profile, ...updatedFields };
    saveProfile(updated);
  };

  // Clean wipe state
  const handleResetAll = () => {
    saveTodos([]);
    saveNotes([]);
    saveProfile(DEFAULT_PROFILE);
  };

  // Dynamic quick-seed preset
  const handleLoadDemoData = () => {
    saveTodos(DEFAULT_TODOS);
    saveNotes(DEFAULT_NOTES);
    saveProfile({
      name: 'Prince Kumar',
      avatar: '🧠',
      dailyGoal: 4,
      accentColor: 'indigo',
      showCompleted: true
    });
  };

  // Sync state after custom backup imported
  const handleRestoreData = () => {
    try {
      const storedTodos = localStorage.getItem('organizer_todos');
      const storedNotes = localStorage.getItem('organizer_notes');
      const storedProfile = localStorage.getItem('organizer_profile');
      const storedHabits = localStorage.getItem('premium_habits_store');

      if (storedTodos) setTodos(JSON.parse(storedTodos));
      if (storedNotes) setNotes(JSON.parse(storedNotes));
      if (storedProfile) setProfile(JSON.parse(storedProfile));
      if (storedHabits) setHabits(JSON.parse(storedHabits));
    } catch (e) {
      console.error("Backup restoration synchronizer error:", e);
    }
  };

  // --- Firebase authentication state listener and live Cloud Sync ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsSyncing(true);
        console.log('[FlowSpace Auth] Active user detected:', firebaseUser.uid);
        try {
          // Fetch Cloud Data
          const cloud = await fetchCloudData(firebaseUser.uid);
          if (cloud) {
            console.log('[FlowSpace Sync] Received clouds backup:', cloud);
            
            // 1. Sync todos
            if (cloud.todos && cloud.todos.length > 0) {
              setTodos(cloud.todos);
              localStorage.setItem('organizer_todos', JSON.stringify(cloud.todos));
            }
            // 2. Sync notes
            if (cloud.notes && cloud.notes.length > 0) {
              setNotes(cloud.notes);
              localStorage.setItem('organizer_notes', JSON.stringify(cloud.notes));
            }
            // 3. Sync profile
            if (cloud.profile) {
              const mergedProfile = {
                ...profile,
                ...cloud.profile,
                name: cloud.profile.name || firebaseUser.displayName || profile.name,
                photoUrl: firebaseUser.photoURL || cloud.profile.photoUrl || profile.photoUrl
              };
              setProfile(mergedProfile);
              localStorage.setItem('organizer_profile', JSON.stringify(mergedProfile));
            } else {
              const initialProfile = {
                ...profile,
                name: firebaseUser.displayName || profile.name,
                photoUrl: firebaseUser.photoURL || profile.photoUrl
              };
              setProfile(initialProfile);
              localStorage.setItem('organizer_profile', JSON.stringify(initialProfile));
              await saveCloudData(firebaseUser.uid, { profile: initialProfile });
            }
            // 4. Sync habits
            if (cloud.habits && cloud.habits.length > 0) {
              setHabits(cloud.habits);
              localStorage.setItem('premium_habits_store', JSON.stringify(cloud.habits));
            }
            // 5. Sync projects
            if (cloud.projects && cloud.projects.length > 0) {
              localStorage.setItem('organizer_projects', JSON.stringify(cloud.projects));
            }
            // 6. Sync focusSessions
            if (cloud.focusSessions && cloud.focusSessions.length > 0) {
              localStorage.setItem('completed_focus_sessions', JSON.stringify(cloud.focusSessions));
            }
            setLastSyncedTime(new Date().toLocaleTimeString());
          } else {
            // First ever login! Upload existing local storage data to the cloud so we preserve their work
            const initialUpload: CloudData = {
              todos: todos.length > 0 ? todos : undefined,
              notes: notes.length > 0 ? notes : undefined,
              profile: {
                ...profile,
                name: firebaseUser.displayName || profile.name,
                photoUrl: firebaseUser.photoURL || profile.photoUrl
              },
              habits: habits.length > 0 ? habits : undefined,
            };
            
            try {
              const projectsSaved = localStorage.getItem('organizer_projects');
              if (projectsSaved) initialUpload.projects = JSON.parse(projectsSaved);
              
              const sessionsSaved = localStorage.getItem('completed_focus_sessions');
              if (sessionsSaved) initialUpload.focusSessions = JSON.parse(sessionsSaved);
            } catch (e) {
              console.error(e);
            }

            console.log('[FlowSpace Sync] Initializing database cloud profile:', initialUpload);
            await saveCloudData(firebaseUser.uid, initialUpload);
            setLastSyncedTime(new Date().toLocaleTimeString());

            if (firebaseUser.displayName || firebaseUser.photoURL) {
              const updatedPr = {
                ...profile,
                name: firebaseUser.displayName || profile.name,
                photoUrl: firebaseUser.photoURL || profile.photoUrl
              };
              setProfile(updatedPr);
              localStorage.setItem('organizer_profile', JSON.stringify(updatedPr));
            }
          }
        } catch (e) {
          console.error('[FlowSpace Sync] Error on Cloud loading:', e);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setUser(null);
        setLastSyncedTime(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Autosave when user performs activities
  useEffect(() => {
    if (!user) return;
    const delayDebounce = setTimeout(async () => {
      console.log('[FlowSpace Sync] Autosaving latest workspace state to Firestore...');
      try {
        const payload: CloudData = {
          todos,
          notes,
          profile,
          habits
        };
        try {
          const lProjects = localStorage.getItem('organizer_projects');
          if (lProjects) payload.projects = JSON.parse(lProjects);

          const lSessions = localStorage.getItem('completed_focus_sessions');
          if (lSessions) payload.focusSessions = JSON.parse(lSessions);
        } catch (_) {}

        await saveCloudData(user.uid, payload);
        setLastSyncedTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('[FlowSpace Sync] Failed to autosave:', err);
      }
    }, 2000);

    return () => clearTimeout(delayDebounce);
  }, [todos, notes, profile, habits, user]);

  const handleGoogleSignIn = async () => {
    setIsSyncing(true);
    try {
      const gUser = await loginWithGoogle();
      const updatedPr = {
        ...profile,
        name: gUser.displayName || profile.name,
        photoUrl: gUser.photoURL || profile.photoUrl
      };
      setProfile(updatedPr);
      localStorage.setItem('organizer_profile', JSON.stringify(updatedPr));
    } catch (error) {
      console.error('[FlowSpace Auth] Google login failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    setIsSyncing(true);
    try {
      await logoutUser();
      setUser(null);
    } catch (e) {
      console.error('[FlowSpace Auth] Sign out failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const payload: CloudData = {
        todos,
        notes,
        profile,
        habits
      };
      
      const lProjects = localStorage.getItem('organizer_projects');
      if (lProjects) payload.projects = JSON.parse(lProjects);

      const lSessions = localStorage.getItem('completed_focus_sessions');
      if (lSessions) payload.focusSessions = JSON.parse(lSessions);

      await saveCloudData(user.uid, payload);
      setLastSyncedTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('[FlowSpace Sync] Manual save failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };


  // Acoustic synthesizer physical click sound & smartphone haptic vibration
  const triggerHapticVibe = () => {
    try {
      // 1. Acoustic Synthesizer Click Accent
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // very short crisp sine ping frequency
        osc.frequency.setValueAtTime(950, ctx.currentTime);
        gain.gain.setValueAtTime(0.012, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
      }
    } catch (_) {}

    // 2. Mobile Vibe Haptics
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([12]);
    }
  };

  // Quick Capture actions
  const handleQcAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcTitle.trim()) return;

    handleAddTodo({
      title: qcTitle.trim(),
      completed: false,
      category: qcCategory,
      priority: qcUrgent ? 'high' : 'medium',
      dueDate: qcDate || undefined,
      subtasks: []
    });

    setQcTitle('');
    setQcUrgent(false);
    setIsQuickCaptureOpen(false);
    triggerHapticVibe();
  };

  const handleQcAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcTitle.trim()) return;

    handleAddNote({
      title: qcTitle.trim(),
      content: qcContent.trim(),
      color: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50 text-violet-900 dark:text-violet-100',
      isPinned: false
    });

    setQcTitle('');
    setQcContent('');
    setIsQuickCaptureOpen(false);
    triggerHapticVibe();
  };

  const handleQcAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcTitle.trim()) return;

    const newHabit: Habit = {
      id: `habit-${Math.random().toString(36).substring(2, 9)}`,
      name: qcTitle.trim(),
      description: qcContent.trim() || undefined,
      frequency: qcHabitFrequency,
      createdAt: new Date().toISOString(),
      streak: 0,
      bestStreak: 0,
      history: {},
      color: qcHabitColor,
      tags: [qcCategory]
    };

    const updatedHabits = [newHabit, ...habits];
    setHabits(updatedHabits);
    localStorage.setItem('premium_habits_store', JSON.stringify(updatedHabits));

    setQcTitle('');
    setQcContent('');
    setIsQuickCaptureOpen(false);
    triggerHapticVibe();
  };

  const handleQcAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcTitle.trim()) return;

    handleAddTodo({
      title: qcTitle.trim(),
      description: qcContent.trim() || undefined,
      completed: false,
      category: qcCategory,
      priority: qcUrgent ? 'high' : 'medium',
      dueDate: qcDate || new Date().toISOString().split('T')[0],
      time: qcEventTime || undefined,
      location: qcEventLocation || undefined,
      subtasks: []
    });

    setQcTitle('');
    setQcContent('');
    setQcEventTime('');
    setQcEventLocation('');
    setIsQuickCaptureOpen(false);
    triggerHapticVibe();
  };

  // Filter completed base on profile view choice
  const displayedTodos = profile.showCompleted 
    ? todos 
    : todos.filter(t => !t.completed);

  // Active accent header helper
  const accentGradient = ACCENT_COLOR_CLASSES[profile.accentColor] || ACCENT_COLOR_CLASSES.indigo;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-950 dark:from-slate-950 dark:via-black dark:to-slate-900 py-0 sm:py-6 flex flex-col items-center justify-center font-sans tracking-tight relative overflow-hidden" id="app-root">
      
      {/* Dynamic Animated subtle background design */}
      <AnimatedBackground />
      
      {/* Simulation preview frame: Mobile-sized on screens wider than sm, stretches full screen on real mobile */}
      <div 
        id="frame-simulator"
        className="w-full sm:max-w-[430px] sm:min-h-[840px] sm:max-h-[880px] bg-[#F8F9FE]/95 dark:bg-[#0F172A]/93 sm:rounded-[40px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] sm:border-[10px] sm:border-slate-950 flex flex-col overflow-hidden relative ring-1 ring-white/15"
      >
        {/* Animated Brand Splash Screen Overlay */}
        <AnimatePresence>
          {showSplash && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-tr from-[#1E1145] via-[#4C1D95] to-[#701A75] z-[100] flex flex-col items-center justify-center p-6 text-center select-none"
              id="brand-splash-overlay"
            >
              {/* Floating ambient energy glow orbs */}
              <div className="absolute top-1/4 -left-12 w-48 h-48 rounded-full bg-[#6C3BFF]/25 blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-1/4 -right-12 w-48 h-48 rounded-full bg-[#A855F7]/20 blur-3xl pointer-events-none animate-pulse" />

              {/* Logo container with continuous custom rotation & spring entry */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 140, 
                  damping: 18, 
                  delay: 0.2 
                }}
                className="relative mb-8"
              >
                {/* Outer dynamic pulsar ring */}
                <span className="absolute -inset-4 rounded-[32px] bg-gradient-to-tr from-[#6C3BFF] to-[#A855F7] opacity-35 blur-lg animate-pulse" />
                
                {/* Rotating dashed geometric boundary */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
                  className="absolute -inset-2.5 rounded-[28px] border-2 border-dashed border-white/20"
                />

                {/* Glassmorphic nested logo plate */}
                <div className="w-20 h-20 rounded-[24px] bg-gradient-to-tr from-[#6C3BFF] via-[#8B5CF6] to-[#A855F7] text-white flex items-center justify-center shadow-[0_12px_40px_rgba(108,59,255,0.45)] border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 rounded-t-[20px] skew-y-3" />
                  
                  <motion.div
                    animate={{ 
                      scale: [1, 1.12, 1],
                      rotate: [0, 8, -8, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3.2,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles size={36} className="stroke-[2.2px] drop-shadow-[0_2px_8px_rgba(255,255,255,0.45)]" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Display Title with elegant tracking */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-sans bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-50 to-purple-200">
                  FlowSpace <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent font-medium">AI</span>
                </h1>
              </motion.div>

              {/* Premium Subtitle Tagline Pill */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="flex items-center gap-2 text-[10px] font-bold text-violet-100/90 font-mono tracking-widest uppercase mt-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
              >
                <span>Plan</span>
                <span className="text-violet-400">•</span>
                <span>Focus</span>
                <span className="text-violet-400">•</span>
                <span>Achieve</span>
              </motion.div>

              {/* Progress Tracker Simulation */}
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.1, ease: "easeInOut", delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-[#6C3BFF] to-[#A855F7] rounded-full"
                />
              </div>

              {/* Version details */}
              <p className="absolute bottom-6 text-[8px] font-mono text-purple-300/40 uppercase tracking-widest">
                FlowSpace engine v1.2.0 • Online
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Device camera bezel element on desktop simulation */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-b-2xl z-50 overflow-hidden" />

        {/* Ambient Animated subtle background design inside phone simulator */}
        <AnimatedBackground />

        {/* 📱 Simulated Dynamic Display Screen Content */}
        <div className="flex-1 overflow-y-auto flex flex-col no-scrollbar pb-24 sm:pb-28">
          
          {/* ⚡ Header Hero Section with Gradient branding and user name */}
          <div className="p-5 pt-6 pb-6 text-white bg-gradient-to-br from-[#6C3BFF] via-[#8B5CF6] to-[#A855F7] relative overflow-hidden" id="main-hero-header">
            {/* Ambient visual background glow dots */}
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full bg-white opacity-15 blur-2xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-0 -translate-x-6 translate-y-6 w-24 h-24 rounded-full bg-black opacity-15 blur-xl pointer-events-none" />

            <div className="flex justify-between items-center mb-3 relative z-10">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('profile')} title="View profile screen">
                <span className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm transition-all shadow-xs ring-1 ring-white/10 overflow-hidden">
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    profile.avatar
                  )}
                </span>
                <div>
                  <h1 className="text-[9px] font-bold text-white/70 uppercase tracking-widest font-mono">FLOWSPACE AI</h1>
                  <p className="text-xs font-semibold text-white mt-0.5 tracking-tight flex items-center gap-1.5 hover:underline">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    Setup: {profile.name} • Active
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-1.5 justify-end">
                {activeTab !== 'aura' ? (
                  <button
                    onClick={() => {
                      setActiveTab('aura');
                      triggerHapticVibe();
                    }}
                    className="flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#1E0B36]/40 hover:bg-[#1E0B36]/65 text-violet-100 hover:text-white backdrop-blur-xs ring-1 ring-violet-400/35 cursor-pointer shadow-tiny transition-all hover:scale-105 active:scale-95 text-[9px]"
                    title="Ask Aura AI Assistant"
                  >
                    <Sparkles size={10} className="text-amber-300 animate-pulse fill-amber-300/10 shrink-0" />
                    <span className="tracking-wide uppercase">Aura AI</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      triggerHapticVibe();
                    }}
                    className="flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs cursor-pointer shadow-tiny transition-all hover:scale-105 active:scale-95 text-[9px]"
                    title="Return to Feed"
                  >
                    <span className="font-extrabold text-[8px] uppercase tracking-wider">Close Aura</span>
                  </button>
                )}
                
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/15 text-white/95 backdrop-blur-xs uppercase tracking-wider">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Quick motivators */}
            <p className="text-[10px] text-white/90 leading-relaxed font-medium mt-1 max-w-[280px]">
              "Set clean actionable intents. Tick them off to trigger clarity loops."
            </p>
          </div>

          {/* 📱 Dynamic Views Container */}
          <div className="px-4 -mt-5 relative z-25 flex-1 min-h-[300px]" id="dynamic-views-container">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  <DashboardView
                    todos={displayedTodos}
                    onToggleTodo={handleToggleTodo}
                    onAddTodo={handleAddTodo}
                    onDeleteTodo={handleDeleteTodo}
                    onUpdateTodo={handleUpdateTodo}
                    onAddNote={handleAddNote}
                    accentColor={profile.accentColor}
                    dailyGoal={profile.dailyGoal}
                    setActiveTab={setActiveTab}
                  />
                </motion.div>
              )}

              {activeTab === 'habits' && (
                <motion.div
                  key="habits"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  <HabitsView
                    accentColor={profile.accentColor}
                  />
                </motion.div>
              )}

              {activeTab === 'timer' && (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  <TimerView
                    accentColor={profile.accentColor}
                    todos={todos}
                    onUpdateTodo={handleUpdateTodo}
                  />
                </motion.div>
              )}

              {activeTab === 'calendar' && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  <CalendarView
                    todos={todos}
                    onToggleTodo={handleToggleTodo}
                    onAddTodo={handleAddTodo}
                    onUpdateTodo={handleUpdateTodo}
                    accentColor={profile.accentColor}
                  />
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  <StatsView
                    todos={todos}
                    accentColor={profile.accentColor}
                  />
                </motion.div>
              )}

              {activeTab === 'projects' && (
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  <ProjectsView
                    accentColor={profile.accentColor}
                  />
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  <NotesView
                    notes={notes}
                    onAddNote={handleAddNote}
                    onEditNote={handleEditNote}
                    onDeleteNote={handleDeleteNote}
                    accentColor={profile.accentColor}
                  />
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  <SettingsView
                    profile={profile}
                    onUpdateProfile={handleUpdateProfile}
                    onResetAll={handleResetAll}
                    onLoadDemoData={handleLoadDemoData}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                    onRestoreData={handleRestoreData}
                    isOffline={isOffline}
                    isInstallable={!!deferredPrompt}
                    isInstalled={isInstalled}
                    onInstall={handleInstallAppInstall}
                    user={user}
                    onLogin={handleGoogleSignIn}
                    onLogout={handleSignOut}
                    isSyncing={isSyncing}
                    onSyncNow={handleManualSync}
                    lastSyncedTime={lastSyncedTime}
                  />
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  <ProfileView
                    profile={profile}
                    todos={todos}
                    habits={habits}
                    notes={notes}
                    onUpdateProfile={handleUpdateProfile}
                    accentColor={profile.accentColor}
                    user={user}
                    onLogin={handleGoogleSignIn}
                    onLogout={handleSignOut}
                    isSyncing={isSyncing}
                    onSyncNow={handleManualSync}
                    lastSyncedTime={lastSyncedTime}
                  />

                </motion.div>
              )}

              {activeTab === 'aura' && (
                <motion.div
                  key="aura"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  <AuraAssistantView
                    todos={todos}
                    notes={notes}
                    habits={habits}
                    onAddTodo={handleAddTodo}
                    onAddNote={handleAddNote}
                    onAddHabit={handleAddHabit}
                    accentColor={profile.accentColor}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* 📱 Ultra polished Floating Bottom Nav Bar upgraded with iOS & TickTick luxury layout */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-[72px] z-40 pointer-events-none flex flex-col items-center justify-end">
          
          {/* FAB Expanded choices container */}
          <AnimatePresence>
            {isFabMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="absolute bottom-[80px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3.5 z-55 min-w-[190px] pointer-events-auto"
                id="fab-expanded-choices-container"
              >
                {/* 1. Add Task */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setQcTab('todo');
                    setIsQuickCaptureOpen(true);
                    setIsFabMenuOpen(false);
                    triggerHapticVibe();
                  }}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-slate-800/60 shadow-[0_4px_20px_rgba(108,59,255,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] text-slate-700 dark:text-slate-200 cursor-pointer w-full hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 font-bold transition-all text-xs focus:outline-none"
                >
                  <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                    <ClipboardList size={16} strokeWidth={2.4} />
                  </div>
                  <span className="font-sans font-extrabold tracking-wide uppercase">Add Task</span>
                </motion.button>

                {/* 2. Add Habit */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setQcTab('habit');
                    setIsQuickCaptureOpen(true);
                    setIsFabMenuOpen(false);
                    triggerHapticVibe();
                  }}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-slate-800/60 shadow-[0_4px_20px_rgba(108,59,255,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] text-slate-700 dark:text-slate-200 cursor-pointer w-full hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 font-bold transition-all text-xs focus:outline-none"
                >
                  <div className="p-2 bg-gradient-to-tr from-rose-500 to-pink-500 text-white rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                    <Flame size={16} strokeWidth={2.4} />
                  </div>
                  <span className="font-sans font-extrabold tracking-wide uppercase">Add Habit</span>
                </motion.button>

                {/* 3. Add Memo */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setQcTab('note');
                    setIsQuickCaptureOpen(true);
                    setIsFabMenuOpen(false);
                    triggerHapticVibe();
                  }}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-slate-800/60 shadow-[0_4px_20px_rgba(108,59,255,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] text-slate-700 dark:text-slate-200 cursor-pointer w-full hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 font-bold transition-all text-xs focus:outline-none"
                >
                  <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                    <StickyNote size={16} strokeWidth={2.4} />
                  </div>
                  <span className="font-sans font-extrabold tracking-wide uppercase">Add Memo</span>
                </motion.button>

                {/* 4. Add Event */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setQcTab('event');
                    setIsQuickCaptureOpen(true);
                    setIsFabMenuOpen(false);
                    triggerHapticVibe();
                  }}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-slate-800/60 shadow-[0_4px_20px_rgba(108,59,255,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] text-slate-700 dark:text-slate-200 cursor-pointer w-full hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 font-bold transition-all text-xs focus:outline-none"
                >
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                    <Calendar size={16} strokeWidth={2.4} />
                  </div>
                  <span className="font-sans font-extrabold tracking-wide uppercase">Add Event</span>
                </motion.button>

                {/* 5. Ask Aura AI */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveTab('aura');
                    setIsFabMenuOpen(false);
                    triggerHapticVibe();
                  }}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-[#6C3BFF]/30 shadow-[0_4px_22px_rgba(108,59,255,0.15)] text-slate-800 dark:text-violet-100 cursor-pointer w-full hover:bg-gradient-to-tr hover:from-[#6C3BFF] hover:to-[#A855F7] hover:text-white font-extrabold transition-all text-xs focus:outline-none"
                >
                  <div className="p-2 bg-gradient-to-tr from-[#6C3BFF] to-[#A855F7] text-white rounded-xl shadow-tiny shrink-0 flex items-center justify-center">
                    <Sparkles size={16} strokeWidth={2.4} className="animate-spin text-white duration-[4000]" />
                  </div>
                  <span className="font-sans font-extrabold tracking-wide uppercase">Ask Aura AI</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 📱 Bottom Navigation Bar */}
          <div 
            id="sticky-navigation-panel"
            className="bottom-nav bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-800/45 shadow-[0_12px_40px_rgba(108,59,255,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.55)] px-3 pl-[12px] pr-[12px] pointer-events-auto"
          >
            {/* Left Grid Columns (4 functional tabs) */}
            <div className="flex items-center justify-around flex-1 h-full gap-0.5 max-[480px]:gap-0 max-[390px]:gap-0">
              {/* Dashboard Tab Trigger */}
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  triggerHapticVibe();
                }}
                id="nav-tab-dashboard"
                className={`flex items-center justify-center cursor-pointer relative py-1 focus:outline-none nav-trigger ${activeTab === 'dashboard' ? 'active' : ''}`}
                title="Feed Dashboard"
              >
                {activeTab === 'dashboard' ? (
                  <motion.div 
                    layoutId="active-pill-indicator"
                    className="active-pill bg-violet-500/10 dark:bg-violet-500/20 text-[#6C3BFF] dark:text-violet-400 p-1.5 xs:p-2 min-[390px]:px-3 min-[390px]:py-2 rounded-full flex items-center justify-center min-[390px]:gap-1.5 border border-violet-500/10 shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  >
                    <ClipboardList size={22} strokeWidth={2.4} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Feed</span>
                  </motion.div>
                ) : (
                  <div className="p-1.5 xs:p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all hover:scale-110 active:scale-90 flex items-center justify-center rounded-full">
                    <ClipboardList size={22} strokeWidth={1.8} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Feed</span>
                  </div>
                )}
              </button>

              {/* Habits Tab Trigger */}
              <button
                onClick={() => {
                  setActiveTab('habits');
                  triggerHapticVibe();
                }}
                id="nav-tab-habits"
                className={`flex items-center justify-center cursor-pointer relative py-1 focus:outline-none nav-trigger ${activeTab === 'habits' ? 'active' : ''}`}
                title="Habit Streaks"
              >
                {activeTab === 'habits' ? (
                  <motion.div 
                    layoutId="active-pill-indicator"
                    className="active-pill bg-violet-500/10 dark:bg-violet-500/20 text-[#8B5CF6] dark:text-violet-400 p-1.5 xs:p-2 min-[390px]:px-3 min-[390px]:py-2 rounded-full flex items-center justify-center min-[390px]:gap-1.5 border border-violet-500/10 shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  >
                    <Heart size={22} strokeWidth={2.4} className="fill-[#8B5CF6]/10" />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Habits</span>
                  </motion.div>
                ) : (
                  <div className="p-1.5 xs:p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all hover:scale-110 active:scale-90 flex items-center justify-center rounded-full">
                    <Heart size={22} strokeWidth={1.8} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Habits</span>
                  </div>
                )}
              </button>

              {/* Timer Tab Trigger */}
              <button
                onClick={() => {
                  setActiveTab('timer');
                  triggerHapticVibe();
                }}
                id="nav-tab-timer"
                className={`flex items-center justify-center cursor-pointer relative py-1 focus:outline-none nav-trigger ${activeTab === 'timer' ? 'active' : ''}`}
                title="Focus Timer"
              >
                {activeTab === 'timer' ? (
                  <motion.div 
                    layoutId="active-pill-indicator"
                    className="active-pill bg-violet-500/10 dark:bg-violet-500/20 text-[#6C3BFF] dark:text-violet-400 p-1.5 xs:p-2 min-[390px]:px-3 min-[390px]:py-2 rounded-full flex items-center justify-center min-[390px]:gap-1.5 border border-violet-500/10 shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  >
                    <Timer size={22} strokeWidth={2.4} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Focus</span>
                  </motion.div>
                ) : (
                  <div className="p-1.5 xs:p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all hover:scale-110 active:scale-90 flex items-center justify-center rounded-full">
                    <Timer size={22} strokeWidth={1.8} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Focus</span>
                  </div>
                )}
              </button>

              {/* Calendar Tab Trigger */}
              <button
                onClick={() => {
                  setActiveTab('calendar');
                  triggerHapticVibe();
                }}
                id="nav-tab-calendar"
                className={`flex items-center justify-center cursor-pointer relative py-1 focus:outline-none nav-trigger ${activeTab === 'calendar' ? 'active' : ''}`}
                title="Planner Board"
              >
                {activeTab === 'calendar' ? (
                  <motion.div 
                    layoutId="active-pill-indicator"
                    className="active-pill bg-violet-500/10 dark:bg-violet-500/20 text-[#8B5CF6] dark:text-violet-400 p-1.5 xs:p-2 min-[390px]:px-3 min-[390px]:py-2 rounded-full flex items-center justify-center min-[390px]:gap-1.5 border border-violet-500/10 shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  >
                    <Calendar size={22} strokeWidth={2.4} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Planner</span>
                  </motion.div>
                ) : (
                  <div className="p-1.5 xs:p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all hover:scale-110 active:scale-90 flex items-center justify-center rounded-full">
                    <Calendar size={22} strokeWidth={1.8} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Planner</span>
                  </div>
                )}
              </button>
            </div>

            {/* Spacer to prevent overlap with middle absolutely positioned FAB */}
            <div className="w-[64px] h-full shrink-0 flex-none" />

            {/* Right Grid Columns (5 functional tabs) */}
            <div className="flex items-center justify-around flex-[1.25] h-full gap-0.5 max-[480px]:gap-0 max-[390px]:gap-0">
              {/* Projects Tab Trigger */}
              <button
                onClick={() => {
                  setActiveTab('projects');
                  triggerHapticVibe();
                }}
                id="nav-tab-projects"
                className={`flex items-center justify-center cursor-pointer relative py-1 focus:outline-none nav-trigger ${activeTab === 'projects' ? 'active' : ''}`}
                title="Projects Boards"
              >
                {activeTab === 'projects' ? (
                  <motion.div 
                    layoutId="active-pill-indicator"
                    className="active-pill bg-violet-500/10 dark:bg-violet-500/20 text-[#8B5CF6] dark:text-violet-400 p-1.5 xs:p-2 min-[390px]:px-3 min-[390px]:py-2 rounded-full flex items-center justify-center min-[390px]:gap-1.5 border border-violet-500/10 shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  >
                    <FolderGit2 size={22} strokeWidth={2.4} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Boards</span>
                  </motion.div>
                ) : (
                  <div className="p-1.5 xs:p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all hover:scale-115 active:scale-90 flex items-center justify-center rounded-full">
                    <FolderGit2 size={22} strokeWidth={1.8} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Boards</span>
                  </div>
                )}
              </button>

              {/* Stats Tab Trigger */}
              <button
                onClick={() => {
                  setActiveTab('stats');
                  triggerHapticVibe();
                }}
                id="nav-tab-stats"
                className={`flex items-center justify-center cursor-pointer relative py-1 focus:outline-none nav-trigger ${activeTab === 'stats' ? 'active' : ''}`}
                title="Stats"
              >
                {activeTab === 'stats' ? (
                  <motion.div 
                    layoutId="active-pill-indicator"
                    className="active-pill bg-violet-500/10 dark:bg-violet-500/20 text-[#6C3BFF] dark:text-violet-400 p-1.5 xs:p-2 min-[390px]:px-3 min-[390px]:py-2 rounded-full flex items-center justify-center min-[390px]:gap-1.5 border border-violet-500/10 shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  >
                    <TrendingUp size={22} strokeWidth={2.4} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Stats</span>
                  </motion.div>
                ) : (
                  <div className="p-1.5 xs:p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all hover:scale-110 active:scale-90 flex items-center justify-center rounded-full">
                    <TrendingUp size={22} strokeWidth={1.8} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Stats</span>
                  </div>
                )}
              </button>

              {/* Notes Tab Trigger */}
              <button
                onClick={() => {
                  setActiveTab('notes');
                  triggerHapticVibe();
                }}
                id="nav-tab-notes"
                className={`flex items-center justify-center cursor-pointer relative py-1 focus:outline-none nav-trigger ${activeTab === 'notes' ? 'active' : ''}`}
                title="Memos"
              >
                {activeTab === 'notes' ? (
                  <motion.div 
                    layoutId="active-pill-indicator"
                    className="active-pill bg-violet-500/10 dark:bg-violet-500/20 text-[#8B5CF6] dark:text-violet-400 p-1.5 xs:p-2 min-[390px]:px-3 min-[390px]:py-2 rounded-full flex items-center justify-center min-[390px]:gap-1.5 border border-violet-500/10 shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  >
                    <StickyNote size={22} strokeWidth={2.4} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Memos</span>
                  </motion.div>
                ) : (
                  <div className="p-1.5 xs:p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all hover:scale-110 active:scale-90 flex items-center justify-center rounded-full">
                    <StickyNote size={22} strokeWidth={1.8} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Memos</span>
                  </div>
                )}
              </button>

              {/* Profile Tab Trigger */}
              <button
                onClick={() => {
                  setActiveTab('profile');
                  triggerHapticVibe();
                }}
                id="nav-tab-profile"
                className={`flex items-center justify-center cursor-pointer relative py-1 focus:outline-none nav-trigger ${activeTab === 'profile' ? 'active' : ''}`}
                title="Profile Cards"
              >
                {activeTab === 'profile' ? (
                  <motion.div 
                    layoutId="active-pill-indicator"
                    className="active-pill bg-violet-500/10 dark:bg-violet-500/20 text-[#6C3BFF] dark:text-violet-400 p-1.5 xs:p-2 min-[390px]:px-3 min-[390px]:py-2 rounded-full flex items-center justify-center min-[390px]:gap-1.5 border border-violet-500/10 shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  >
                    <User size={22} strokeWidth={2.4} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Profile</span>
                  </motion.div>
                ) : (
                  <div className="p-1.5 xs:p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all hover:scale-110 active:scale-90 flex items-center justify-center rounded-full">
                    <User size={22} strokeWidth={1.8} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Profile</span>
                  </div>
                )}
              </button>

              {/* Settings Tab Trigger */}
              <button
                onClick={() => {
                  setActiveTab('settings');
                  triggerHapticVibe();
                }}
                id="nav-tab-settings"
                className={`flex items-center justify-center cursor-pointer relative py-1 focus:outline-none nav-trigger ${activeTab === 'settings' ? 'active' : ''}`}
                title="Settings Config"
              >
                {activeTab === 'settings' ? (
                  <motion.div 
                    layoutId="active-pill-indicator"
                    className="active-pill bg-slate-900/10 dark:bg-slate-100/20 text-slate-900 dark:text-slate-100 p-1.5 xs:p-2 min-[390px]:px-3 min-[390px]:py-2 rounded-full flex items-center justify-center min-[390px]:gap-1.5 border border-slate-400/10 shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  >
                    <Settings size={22} strokeWidth={2.4} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Config</span>
                  </motion.div>
                ) : (
                  <div className="p-1.5 xs:p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all hover:scale-110 active:scale-90 flex items-center justify-center rounded-full">
                    <Settings size={22} strokeWidth={1.8} />
                    <span className="text-[10px] md:text-[11px] font-extrabold tracking-tight">Config</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 64px Floating Action Button (FAB) nested at the top level of z-40 bar for overflow support */}
          <button
            onClick={() => {
              setIsFabMenuOpen(!isFabMenuOpen);
              triggerHapticVibe();
            }}
            id="center-floating-fab-trigger"
            className="fab-button cursor-pointer rounded-full bg-gradient-to-tr from-[#6C3BFF] to-[#A855F7] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(108,59,255,0.45)] dark:shadow-[0_8px_30px_rgba(108,59,255,0.6)] border-2 border-white dark:border-slate-800 hover:scale-[1.10] active:scale-95 transition-all outline-none group"
            title="Toggle Quick Add Selector"
          >
            {/* Pulsing halo effects */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#6C3BFF] to-[#A855F7] opacity-40 blur-md animate-pulse -z-10" />
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#6C3BFF]/20 animate-ping opacity-75 -z-10" />

            <Plus 
              size={28} 
              className="stroke-[3px]" 
              style={{ transform: isFabMenuOpen ? 'rotate(135deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
            />
            {!isFabMenuOpen && (
              <span className="absolute -top-1 px-1.5 py-0.5 rounded-full bg-red-500 text-[7px] text-white font-extrabold scale-90 tracking-widest uppercase shadow-xs animate-bounce animate-duration-1000">
                New
              </span>
            )}
          </button>
        </div>

        {/* FAB Menu Backdrop Click-off Mask */}
        <AnimatePresence>
          {isFabMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFabMenuOpen(false)}
              className="fixed inset-0 z-30 bg-slate-950/30 dark:bg-black/45 backdrop-blur-[1.5px] cursor-pointer"
              id="fab-menu-backdrop-mask"
            />
          )}
        </AnimatePresence>

        {/* 🔮 MULTI-FUNCTION QUICK CAPTURE MODAL (TickTick & iOS style elevated panel drawer) */}
        <AnimatePresence>
          {isQuickCaptureOpen && (
            <div 
              className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" 
              id="quick-capture-modal-mask"
              onClick={() => { setIsQuickCaptureOpen(false); triggerHapticVibe(); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 40 }}
                transition={{ type: "spring", stiffness: 340, damping: 26 }}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-150 dark:border-slate-800 rounded-[30px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] max-w-sm w-full text-left relative overflow-hidden"
                id="quick-capture-modal-card"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Visual Ambient Glows */}
                <div className="absolute right-[-20px] top-[-20px] w-36 h-36 bg-[#6C3BFF]/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute left-[-20px] bottom-[-20px] w-36 h-36 bg-fuchsia-600/10 rounded-full blur-2xl pointer-events-none" />

                {/* header */}
                <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3.5 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-violet-500/10 text-[#6C3BFF] flex items-center justify-center shadow-tiny">
                      <Sparkles size={16} className="animate-spin-slow text-[#6C3BFF]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest font-sans">Quick Capture</h3>
                      <p className="text-[10px] text-slate-400">Instantly commit routines</p>
                    </div>
                  </div>

                  {/* fast selector tabs */}
                  <div className="bg-slate-100/90 dark:bg-slate-950/50 p-0.5 rounded-xl flex gap-1 border border-slate-200/40 dark:border-slate-800/40 overflow-x-auto scrollbar-none">
                    {(['todo', 'event', 'habit', 'note'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => { setQcTab(tab); triggerHapticVibe(); }}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold tracking-wider transition-all cursor-pointer uppercase shrink-0 ${
                          qcTab === tab 
                            ? 'bg-gradient-to-tr from-[#6C3BFF] to-violet-600 text-white shadow-sm font-black' 
                            : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
                        }`}
                      >
                        {tab === 'todo' ? 'Task' : tab === 'note' ? 'Memo' : tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub Forms block with animations */}
                <AnimatePresence mode="wait">
                  {qcTab === 'todo' && (
                    <motion.form 
                      key="qc-todo-form-panel"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      onSubmit={handleQcAddTodo}
                      className="flex flex-col gap-3.5 relative z-10"
                    >
                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                          Task Description / Objectives
                        </label>
                        <input 
                          type="text"
                          required
                          value={qcTitle}
                          onChange={(e) => setQcTitle(e.target.value)}
                          placeholder="e.g. Prepare deck for sprint planning"
                          className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:border-[#6C3BFF] focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/10 transition-all font-sans"
                          id="inputs-qc-captured-todo"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                            Category Tags
                          </label>
                          <select
                            value={qcCategory}
                            onChange={(e) => setQcCategory(e.target.value)}
                            className="w-full px-2.5 py-2 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-[#6C3BFF]"
                          >
                            <option value="Personal">🏠 Personal</option>
                            <option value="Work">💼 Work</option>
                            <option value="Wellness">🌱 Wellness</option>
                            <option value="Finance">💰 Finance</option>
                            <option value="Urgent">🔥 Urgent</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                            Target Deadline
                          </label>
                          <input
                            type="date"
                            value={qcDate}
                            onChange={(e) => setQcDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-[#6C3BFF]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-250">Mark Urgent Status</span>
                          <span className="text-[8.5px] text-slate-400">Forces display on critical feed dashboard</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={qcUrgent}
                          onChange={(e) => setQcUrgent(e.target.checked)}
                          className="w-4 h-4 rounded text-[#6C3BFF] focus:ring-[#6C3BFF] cursor-pointer"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!qcTitle.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-[#6C3BFF] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Commit Task
                      </button>
                    </motion.form>
                  )}

                  {qcTab === 'event' && (
                    <motion.form 
                      key="qc-event-form-panel"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      onSubmit={handleQcAddEvent}
                      className="flex flex-col gap-3.5 relative z-10"
                    >
                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                          Event Title
                        </label>
                        <input 
                          type="text"
                          required
                          value={qcTitle}
                          onChange={(e) => setQcTitle(e.target.value)}
                          placeholder="e.g. Design review presentation"
                          className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:border-[#6C3BFF] focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/10 transition-all font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                          Event Description (Notes)
                        </label>
                        <input 
                          type="text"
                          value={qcContent}
                          onChange={(e) => setQcContent(e.target.value)}
                          placeholder="e.g. Reviewing with developers & leads"
                          className="w-full px-3.5 py-2 text-xs font-semibold text-slate-705 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:border-[#6C3BFF] focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/10 transition-all font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                            Target Date
                          </label>
                          <input
                            type="date"
                            required
                            value={qcDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setQcDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-[#6C3BFF]"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={qcEventTime}
                            onChange={(e) => setQcEventTime(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-[#6C3BFF]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                            Location
                          </label>
                          <input
                            type="text"
                            value={qcEventLocation}
                            onChange={(e) => setQcEventLocation(e.target.value)}
                            placeholder="e.g. Zoom, Room 402"
                            className="w-full px-2.5 py-1.5 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-[#6C3BFF]"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                            Category Tags
                          </label>
                          <select
                            value={qcCategory}
                            onChange={(e) => setQcCategory(e.target.value)}
                            className="w-full px-2.5 py-2 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-[#6C3BFF]"
                          >
                            <option value="Personal">🏠 Personal</option>
                            <option value="Work">💼 Work</option>
                            <option value="Wellness">🌱 Wellness</option>
                            <option value="Finance">💰 Finance</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!qcTitle.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-[#6C3BFF] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Commit Calendar Event
                      </button>
                    </motion.form>
                  )}

                  {qcTab === 'habit' && (
                    <motion.form 
                      key="qc-habit-form-panel"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      onSubmit={handleQcAddHabit}
                      className="flex flex-col gap-3.5 relative z-10"
                    >
                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                          Habit Routine Name
                        </label>
                        <input 
                          type="text"
                          required
                          value={qcTitle}
                          onChange={(e) => setQcTitle(e.target.value)}
                          placeholder="e.g. 15 Min Sun Stretch"
                          className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:border-[#6C3BFF] focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/10 transition-all font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                          Description (Intent)
                        </label>
                        <input 
                          type="text"
                          value={qcContent}
                          onChange={(e) => setQcContent(e.target.value)}
                          placeholder="e.g. To boost energetic daily start"
                          className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:border-[#6C3BFF] focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/10 transition-all font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                            Frequency
                          </label>
                          <select
                            value={qcHabitFrequency}
                            onChange={(e) => setQcHabitFrequency(e.target.value as 'daily' | 'weekly')}
                            className="w-full px-2.5 py-2 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-[#6C3BFF]"
                          >
                            <option value="daily">🔥 Daily Streak</option>
                            <option value="weekly">🗓️ Weekly Target</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                            Theme Accent
                          </label>
                          <select
                            value={qcHabitColor}
                            onChange={(e) => setQcHabitColor(e.target.value)}
                            className="w-full px-2.5 py-2 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-[#6C3BFF]"
                          >
                            <option value="violet">💜 Violet</option>
                            <option value="indigo">💙 Indigo</option>
                            <option value="emerald">💚 Emerald</option>
                            <option value="amber">💛 Amber</option>
                            <option value="rose">💗 Rose</option>
                            <option value="sky">🩵 Sky</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                          Category Tags
                        </label>
                        <select
                          value={qcCategory}
                          onChange={(e) => setQcCategory(e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-[#6C3BFF]"
                        >
                          <option value="Personal">🏠 Personal</option>
                          <option value="Work">💼 Work</option>
                          <option value="Wellness">🌱 Wellness</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={!qcTitle.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-[#6C3BFF] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Commit Habit Streak
                      </button>
                    </motion.form>
                  )}

                  {qcTab === 'note' && (
                    <motion.form 
                      key="qc-note-form-panel"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      onSubmit={handleQcAddNote}
                      className="flex flex-col gap-3.5 relative z-10"
                    >
                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                          Memo Title
                        </label>
                        <input 
                          type="text"
                          required
                          value={qcTitle}
                          onChange={(e) => setQcTitle(e.target.value)}
                          placeholder="e.g. Books to read this summer"
                          className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:border-[#6C3BFF] focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/10 transition-all font-sans"
                          id="inputs-qc-captured-note"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                          Note / Memo Contents
                        </label>
                        <textarea
                          required
                          value={qcContent}
                          onChange={(e) => setQcContent(e.target.value)}
                          placeholder="Draft markdown notes, ideas, or reminders here..."
                          rows={3}
                          className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:border-[#6C3BFF] focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/10 transition-all font-sans resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!qcTitle.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-[#6C3BFF] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Commit Memo Note
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Footer and dismiss element */}
                <div className="mt-3.5 flex justify-center border-t border-slate-100/50 dark:border-slate-800/40 pt-3 relative z-10">
                  <button
                    type="button"
                    onClick={() => { setIsQuickCaptureOpen(false); triggerHapticVibe(); }}
                    className="text-[10px] font-black tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 uppercase font-mono cursor-pointer transition-all"
                  >
                    Click outside or tap here to close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 📶 Premium PWA Connection Toast Container */}
        <AnimatePresence>
          {showOfflineToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 30, x: "-50%" }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="fixed bottom-26 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.25)] border backdrop-blur-md select-none pointer-events-none"
              style={{
                backgroundColor: isOffline ? "rgba(245, 158, 11, 0.92)" : "rgba(16, 185, 129, 0.92)",
                borderColor: isOffline ? "rgba(217, 119, 6, 0.5)" : "rgba(5, 150, 105, 0.5)",
                color: "#ffffff"
              }}
            >
              <div className="flex items-center gap-2 font-sans font-extrabold text-xs">
                {isOffline ? (
                  <>
                    <WifiOff size={14} className="stroke-[2.5px] animate-pulse" />
                    <span>Offline mode active • Local data saved securely</span>
                  </>
                ) : (
                  <>
                    <Wifi size={14} className="stroke-[2.5px]" />
                    <span>Cloud connection active • AI Coach fully online</span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}

