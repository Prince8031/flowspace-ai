import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Target, 
  Palette, 
  Sliders, 
  RefreshCcw, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Download, 
  Upload, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  BellRing,
  CheckCircle,
  FileText,
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react';
import { UserProfile, Todo, Note } from '../types';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onResetAll: () => void;
  onLoadDemoData: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onRestoreData?: () => void;
  isOffline?: boolean;
  isInstallable?: boolean;
  isInstalled?: boolean;
  onInstall?: () => void;
  user?: any;
  onLogin?: () => void;
  onLogout?: () => void;
  isSyncing?: boolean;
  onSyncNow?: () => void;
  lastSyncedTime?: string | null;
}

const ACCENTS = [
  { name: 'Indigo Dream', id: 'indigo', colorClass: 'bg-indigo-600 border-indigo-250' },
  { name: 'Rose Red', id: 'rose', colorClass: 'bg-rose-500 border-rose-250' },
  { name: 'Emerald Green', id: 'emerald', colorClass: 'bg-emerald-500 border-emerald-250' },
  { name: 'Amber Gold', id: 'amber', colorClass: 'bg-amber-500 border-amber-250' },
  { name: 'Sky Blue', id: 'sky', colorClass: 'bg-sky-500 border-sky-250' },
  { name: 'Violet Royal', id: 'violet', colorClass: 'bg-violet-600 border-violet-250' }
];

const EMOJI_AVATARS = ['🎯', '🚀', '🧠', '💼', '🍕', '🌟', '🎸', '🎨', '🐶', '💻', '🔮', '🧘'];

const ACCENT_TEXT_MAP: Record<string, string> = {
  indigo: 'text-indigo-600 dark:text-indigo-400',
  rose: 'text-rose-500 dark:text-rose-400',
  emerald: 'text-emerald-500 dark:text-emerald-400',
  amber: 'text-amber-500 dark:text-amber-400',
  sky: 'text-sky-500 dark:text-sky-400',
  violet: 'text-violet-600 dark:text-violet-400'
};

const ACCENT_BORDER_MAP: Record<string, string> = {
  indigo: 'border-indigo-600/30 focus:border-indigo-600',
  rose: 'border-rose-500/30 focus:border-rose-500',
  emerald: 'border-emerald-500/30 focus:border-emerald-500',
  amber: 'border-amber-500/30 focus:border-amber-500',
  sky: 'border-sky-500/30 focus:border-sky-500',
  violet: 'border-violet-600/30 focus:border-violet-600'
};

export default function SettingsView({
  profile,
  onUpdateProfile,
  onResetAll,
  onLoadDemoData,
  isDarkMode,
  onToggleDarkMode,
  onRestoreData,
  isOffline = false,
  isInstallable = false,
  isInstalled = false,
  onInstall,
  user,
  onLogin,
  onLogout,
  isSyncing,
  onSyncNow,
  lastSyncedTime
}: SettingsViewProps) {
  const [name, setName] = useState(profile.name);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings states hooked directly to local storage / profile
  const [acousticEnabled, setAcousticEnabled] = useState<boolean>(() => {
    return localStorage.getItem('acoustic_chimes_enabled') !== 'false';
  });

  const [pomodoroSound, setPomodoroSound] = useState<boolean>(() => {
    return localStorage.getItem('pomodoro_sound_enabled') !== 'false';
  });

  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(() => {
    return localStorage.getItem('study_reminders_enabled') === 'true';
  });

  const [privacyShield, setPrivacyShield] = useState<boolean>(() => {
    return localStorage.getItem('privacy_shield_enabled') === 'true';
  });

  const [privacyHideNotes, setPrivacyHideNotes] = useState<boolean>(() => {
    return localStorage.getItem('privacy_hide_notes') === 'true';
  });

  const playSuccessChime = () => {
    if (!acousticEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch (_) {}
  };

  const triggerSuccess = (text: string) => {
    setSuccessMsg(text);
    playSuccessChime();
    setTimeout(() => {
      setSuccessMsg('');
    }, 2500);
  };

  const triggerError = (text: string) => {
    setErrorMsg(text);
    setTimeout(() => {
      setErrorMsg('');
    }, 4000);
  };

  const handleSaveName = (newName: string) => {
    setName(newName);
    onUpdateProfile({ name: newName });
    triggerSuccess('Greeting name customized!');
  };

  const handleAvatarSelect = (avatar: string) => {
    onUpdateProfile({ avatar });
    triggerSuccess('Avatar image updated!');
  };

  const handleAccentSelect = (id: string) => {
    onUpdateProfile({ accentColor: id });
    triggerSuccess(`Accent set to ${id.toUpperCase()}`);
  };

  const incrementGoal = () => {
    const val = Math.max(1, profile.dailyGoal + 1);
    onUpdateProfile({ dailyGoal: val });
  };

  const decrementGoal = () => {
    const val = Math.max(1, profile.dailyGoal - 1);
    onUpdateProfile({ dailyGoal: val });
  };

  // Toggle Sound Chimes helper
  const handleToggleAcoustic = () => {
    const nextVal = !acousticEnabled;
    setAcousticEnabled(nextVal);
    localStorage.setItem('acoustic_chimes_enabled', String(nextVal));
    if (nextVal) {
      setTimeout(() => {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
          }
        } catch (_) {}
      }, 50);
    }
    triggerSuccess(nextVal ? 'Chimes enabled' : 'Chimes silenced');
  };

  // Toggle Pomodoro Sound helper
  const handleTogglePomodoroSound = () => {
    const nextVal = !pomodoroSound;
    setPomodoroSound(nextVal);
    localStorage.setItem('pomodoro_sound_enabled', String(nextVal));
    triggerSuccess(nextVal ? 'Timer sounds active' : 'Timer sounds silent');
  };

  // Toggle alerts
  const handleToggleReminders = () => {
    const nextVal = !remindersEnabled;
    setRemindersEnabled(nextVal);
    localStorage.setItem('study_reminders_enabled', String(nextVal));
    triggerSuccess(nextVal ? 'Goal notifications active' : 'Goal notifications halted');
  };

  // Toggle Privacy Cloak (Unfinished titles blur)
  const handleTogglePrivacyShield = () => {
    const nextVal = !privacyShield;
    setPrivacyShield(nextVal);
    localStorage.setItem('privacy_shield_enabled', String(nextVal));
    triggerSuccess(nextVal ? 'Task shielding enabled' : 'Task shielding disabled');
  };

  // Toggle notes hide
  const handleTogglePrivacyNotes = () => {
    const nextVal = !privacyHideNotes;
    setPrivacyHideNotes(nextVal);
    localStorage.setItem('privacy_hide_notes', String(nextVal));
    triggerSuccess(nextVal ? 'Notes hidden in overview' : 'Notes revealed in overview');
  };

  // 📥 EXPORT WORKSPACE ARCHIVE DATA
  const handleExportData = () => {
    try {
      // Gather everything inside dynamic context
      const exportObject = {
        signature: 'ORGANIZER_WORKSPACE_ARCHIVE_AESTHETIC',
        exportedAt: new Date().toISOString(),
        todos: JSON.parse(localStorage.getItem('organizer_todos') || '[]'),
        notes: JSON.parse(localStorage.getItem('organizer_notes') || '[]'),
        habits: JSON.parse(localStorage.getItem('premium_habits_store') || '[]'),
        profile: JSON.parse(localStorage.getItem('organizer_profile') || '{}'),
        focusSessions: JSON.parse(localStorage.getItem('completed_focus_sessions') || '[]')
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      
      const fileDate = new Date().toISOString().slice(0,10);
      downloadAnchor.setAttribute("download", `organizer-study-backup-${fileDate}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      triggerSuccess('Workspace backup downloaded!');
    } catch (e: any) {
      triggerError(`Export failed: ${e.message}`);
    }
  };

  // 📤 IMPORT & RESTORE WORKSPACE DATA
  const handleImportFile = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Schema validation
        if (parsed.signature !== 'ORGANIZER_WORKSPACE_ARCHIVE_AESTHETIC') {
          throw new Error('Not a matching Organizer Backup archive file.');
        }

        // Backup existing data to restore path
        if (parsed.todos) {
          localStorage.setItem('organizer_todos', JSON.stringify(parsed.todos));
        }
        if (parsed.notes) {
          localStorage.setItem('organizer_notes', JSON.stringify(parsed.notes));
        }
        if (parsed.habits) {
          localStorage.setItem('premium_habits_store', JSON.stringify(parsed.habits));
        }
        if (parsed.profile) {
          localStorage.setItem('organizer_profile', JSON.stringify(parsed.profile));
        }
        if (parsed.focusSessions) {
          localStorage.setItem('completed_focus_sessions', JSON.stringify(parsed.focusSessions));
        }

        triggerSuccess('Workspace restored successfully!');
        
        // Notify App.tsx to reload its states
        if (onRestoreData) {
          onRestoreData();
        }
      } catch (err: any) {
        triggerError(`Import Error: ${err.message || 'Malformed backup parameters.'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImportFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left" id="settings-view-root">
      
      {/* 🚀 SETTINGS HERO BANNER */}
      <div className="p-5.5 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 text-white relative overflow-hidden shadow-sm">
        <div className="absolute right-[-20px] top-[-20px] w-36 h-36 bg-[#6C3BFF]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold tracking-wider text-indigo-300 uppercase font-mono mb-2">
            Workspace Console
          </div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            Systems Preferences
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm leading-relaxed">
            Customize layout styles, change greeting settings, manage offline database backups, and encrypt on-screen lists.
          </p>
        </div>
      </div>

      {/* SUCCESS & ERROR TOASTERS */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs"
          >
            <CheckCircle size={14} className="text-emerald-500" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs"
          >
            <ShieldAlert size={14} className="text-rose-500" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* COLUMN 1: USER ID & PERSISTENCE GOALS */}
        <div className="md:col-span-7 flex flex-col gap-5">
          
          {/* 👤 GREETING NAME & AVATAR BOX (Change Greeting Name) */}
          <motion.div 
            id="profile-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[28px] p-5.5 border border-slate-100 dark:border-slate-800 shadow-3xs"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-dashed border-slate-100 dark:border-slate-800 pb-3">
              <User size={15} className={ACCENT_TEXT_MAP[profile.accentColor]} />
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">Greeting Name & Persona</h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex items-center justify-center text-3xl shadow-3xs hover:scale-105 transition-transform shrink-0">
                  {profile.avatar}
                </div>
                
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1">
                    Greeting Nickname
                  </label>
                  <input
                    type="text"
                    id="profile-nickname-input"
                    value={name}
                    onChange={(e) => handleSaveName(e.target.value)}
                    placeholder="Premium User"
                    className={`w-full px-3.5 py-1.5 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-black transition-all ${ACCENT_BORDER_MAP[profile.accentColor]}`}
                  />
                </div>
              </div>

              {/* Emoji selector */}
              <div>
                <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-2">
                  Select Icon Avatar
                </span>
                <div className="grid grid-cols-6 gap-1.5" id="avatar-emoji-selectors">
                  {EMOJI_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAvatarSelect(emoji)}
                      className={`py-1.5 rounded-xl text-base flex items-center justify-center border transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                        profile.avatar === emoji
                          ? 'border-slate-800 dark:border-slate-100 bg-slate-50 dark:bg-slate-850 shadow-3xs'
                          : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 🎯 DAILY GOAL COUNTER */}
          <motion.div 
            id="goals-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[28px] p-5.5 border border-slate-100 dark:border-slate-800 shadow-3xs"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-dashed border-slate-100 dark:border-slate-800 pb-3">
              <Target size={15} className={ACCENT_TEXT_MAP[profile.accentColor]} />
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">Daily Target Target</h3>
            </div>

            <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850/60">
              <div>
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100">Task Synergy Goal</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal max-w-xs">
                  Number of completed checklists required to elevate your Daily Synergy Rating to 100%.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={decrementGoal}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-95 text-slate-700 dark:text-slate-300 cursor-pointer shadow-3xs"
                >
                  -
                </button>
                <span className="text-base font-extrabold text-slate-800 dark:text-white font-display min-w-[18px] text-center">
                  {profile.dailyGoal}
                </span>
                <button
                  onClick={incrementGoal}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-95 text-slate-700 dark:text-slate-300 cursor-pointer shadow-3xs"
                >
                  +
                </button>
              </div>
            </div>
          </motion.div>

          {/* 🔊 SOUND WORKSPACE & NOTIFICATIONS */}
          <motion.div
            id="notifications-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[28px] p-5.5 border border-slate-100 dark:border-slate-800 shadow-3xs"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-dashed border-slate-100 dark:border-slate-800 pb-3">
              <BellRing size={15} className={ACCENT_TEXT_MAP[profile.accentColor]} />
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono font-bold">Sound & Alerts</h3>
            </div>

            <div className="flex flex-col gap-3">
              {/* Sound Chimes Enable */}
              <div className="flex items-center justify-between p-1 bg-slate-50/40 dark:bg-slate-950/20 p-2 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    {acousticEnabled ? <Volume2 size={13} className="text-[#6C3BFF]" /> : <VolumeX size={13} className="text-slate-400" />}
                    <span>Sound Effects & Audio Beeps</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Play micro acoustic feedback when registering lists and schedules</p>
                </div>
                <button
                  onClick={handleToggleAcoustic}
                  className={`w-10 h-5.5 rounded-full relative flex items-center cursor-pointer transition-colors ${acousticEnabled ? 'bg-[#6C3BFF]' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  <motion.span 
                    layout
                    className="w-4 h-4 rounded-full bg-white mx-0.5 shadow-sm absolute"
                    animate={{ x: acousticEnabled ? 18 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Focus sounds switch */}
              <div className="flex items-center justify-between p-1 bg-slate-50/40 dark:bg-slate-950/20 p-2 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Focus Ringtone & Bells</h4>
                  <p className="text-[10px] text-slate-400">Enable chime rings on Pomodoro completed intervals</p>
                </div>
                <button
                  onClick={handleTogglePomodoroSound}
                  className={`w-10 h-5.5 rounded-full relative flex items-center cursor-pointer transition-colors ${pomodoroSound ? 'bg-[#6C3BFF]' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  <motion.span 
                    layout
                    className="w-4 h-4 rounded-full bg-white mx-0.5 shadow-sm absolute"
                    animate={{ x: pomodoroSound ? 18 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Reminders toggle */}
              <div className="flex items-center justify-between p-1 bg-slate-50/40 dark:bg-slate-950/20 p-2 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Study Goal Reminders</h4>
                  <p className="text-[10px] text-slate-400">Notify immediately when focus goals or habit streaks update</p>
                </div>
                <button
                  onClick={handleToggleReminders}
                  className={`w-10 h-5.5 rounded-full relative flex items-center cursor-pointer transition-colors ${remindersEnabled ? 'bg-[#6C3BFF]' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  <motion.span 
                    layout
                    className="w-4 h-4 rounded-full bg-white mx-0.5 shadow-sm absolute"
                    animate={{ x: remindersEnabled ? 18 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </motion.div>

        </div>

        {/* COLUMN 2: DEEP PALETTE & SYSTEMS OVERRIDES */}
        <div className="md:col-span-5 flex flex-col gap-5">
          
          {/* 🎨 COGNITIVE COLOR PALETTE & DARK MODE */}
          <motion.div 
            id="styles-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[28px] p-5.5 border border-slate-100 dark:border-slate-800 shadow-3xs"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-dashed border-slate-100 dark:border-slate-800 pb-3">
              <Palette size={15} className={ACCENT_TEXT_MAP[profile.accentColor]} />
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">Theme & Accent</h3>
            </div>

            {/* Dark mode direct switch */}
            {onToggleDarkMode && (
              <div className="flex items-center justify-between p-3.5 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Space Dark Mode</h4>
                  <p className="text-[10px] text-slate-400">Eye-safe Cosmic background shading</p>
                </div>
                <button
                  onClick={onToggleDarkMode}
                  id="toggle-dark-mode"
                  className={`w-10 h-5.5 rounded-full relative flex items-center cursor-pointer transition-colors ${isDarkMode ? 'bg-[#6C3BFF]' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  <motion.span 
                    layout
                    className="w-4 h-4 rounded-full bg-white mx-0.5 shadow-xs absolute cursor-pointer"
                    animate={{ x: isDarkMode ? 18 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            )}

            {/* Accent selection grid */}
            <div>
              <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-2.5">
                Active Color Highlights
              </span>
              <div className="grid grid-cols-2 gap-2" id="accent-theme-grid">
                {ACCENTS.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleAccentSelect(acc.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-95 text-left cursor-pointer ${
                      profile.accentColor === acc.id
                        ? 'border-slate-800 dark:border-slate-100 ring-2 ring-slate-100 dark:ring-slate-850 bg-slate-50 dark:bg-slate-850'
                        : 'border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full ${acc.colorClass} border`} />
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-355 leading-none">{acc.name.split(' ')[0]}</span>
                    </div>
                    {profile.accentColor === acc.id && (
                      <Check size={11} className="text-slate-800 dark:text-slate-100" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 🔒 CLASSIFIED PRIVACY SHIELD */}
          <motion.div
            id="privacy-shield-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[28px] p-5.5 border border-slate-100 dark:border-slate-800 shadow-3xs"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-dashed border-slate-100 dark:border-slate-800 pb-3">
              <EyeOff size={15} className={ACCENT_TEXT_MAP[profile.accentColor]} />
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">Classified Privacy Shield</h3>
            </div>

            <div className="flex flex-col gap-3">
              {/* Blur Unfinished Switch */}
              <div className="flex items-center justify-between p-1 bg-slate-50/40 dark:bg-slate-950/20 p-2 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Task Title Cloak</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Blur pending tasks on the dashboard to protect from shoulder surfing (reveal on hover)</p>
                </div>
                <button
                  onClick={handleTogglePrivacyShield}
                  className={`w-10 h-5.5 rounded-full relative flex items-center cursor-pointer transition-colors ${privacyShield ? 'bg-[#6C3BFF]' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  <motion.span 
                    layout
                    className="w-4 h-4 rounded-full bg-white mx-0.5 shadow-sm absolute"
                    animate={{ x: privacyShield ? 18 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Hide notes summary previews */}
              <div className="flex items-center justify-between p-1 bg-slate-50/40 dark:bg-slate-950/20 p-2 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Obfuscate Note Contents</h4>
                  <p className="text-[10px] text-slate-400">Mask note content in overview summaries until actively selected</p>
                </div>
                <button
                  onClick={handleTogglePrivacyNotes}
                  className={`w-10 h-5.5 rounded-full relative flex items-center cursor-pointer transition-colors ${privacyHideNotes ? 'bg-[#6C3BFF]' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  <motion.span 
                    layout
                    className="w-4 h-4 rounded-full bg-white mx-0.5 shadow-sm absolute"
                    animate={{ x: privacyHideNotes ? 18 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className="mt-2.5 p-2.5 rounded-xl border border-dashed border-indigo-100 dark:border-indigo-950/50 bg-indigo-50/15 text-[10px] text-[#6C3BFF] dark:text-indigo-400 leading-relaxed font-semibold">
                🔒 Direct Sandstone Crypt: All records reside solely inside your browser cache. Zero transmissions to remote clouds.
              </div>
            </div>
          </motion.div>

        </div>

      </div>

      {/* 📱 PORTABLE DESKTOP & MOBILE PWA CONTROL APP */}
      <motion.div
        id="pwa-application-panel"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[28px] p-5.5 border border-slate-100 dark:border-slate-800 shadow-3xs text-left mb-6"
      >
        <div className="flex items-center justify-between mb-4 border-b border-dashed border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Smartphone size={15} className={ACCENT_TEXT_MAP[profile.accentColor]} />
            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono font-bold">Progressive Web App Setup</h3>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {isOffline ? (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold border border-amber-500/15 flex items-center gap-1">
                <WifiOff size={9} /> Offline Mode
              </span>
            ) : (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/15 flex items-center gap-1">
                <Wifi size={9} /> Network Active
              </span>
            )}
            {isInstalled && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-[#6C3BFF] dark:text-violet-400 font-bold border border-violet-500/15">
                Installed (Standalone)
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-950/20 flex flex-col items-center text-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-600 text-white shadow-md relative group">
            <Sparkles size={24} className="stroke-[2px] animate-pulse" />
            <div className="absolute inset-x-0 -bottom-1 w-3 h-1 bg-violet-400/50 rounded-full blur-xs" />
          </div>

          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
              Install FlowSpace AI Native App
            </h4>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Launch directly from your desktop, dock, or home screen. Enable full offline execution, automatic data synchronization, dedicated borderless layouts, and zero browser tab clutter.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isInstalled ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key="installed-state"
                className="w-full p-2.5 rounded-xl border border-dashed border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[10px] leading-relaxed font-bold flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={12} className="shrink-0" />
                <span>FlowSpace AI launched and fully cached. You are running the standalone application!</span>
              </motion.div>
            ) : isInstallable ? (
              <motion.button
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key="installable-state"
                onClick={onInstall}
                id="pwa-install-app-btn"
                className="w-full max-w-sm py-3 rounded-xl text-xs font-black bg-[#6C3BFF] hover:bg-violet-500 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-[0.99] border border-white/10"
              >
                <Download size={13} className="stroke-[2.5px]" />
                <span>Install FlowSpace AI App</span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="guide-state"
                className="w-full border border-dashed border-slate-205 dark:border-slate-800 rounded-xl p-3 bg-slate-50/5 text-left"
              >
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 font-mono tracking-wider text-center">
                  Device Add to Home Setup Guides
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-white/40 dark:bg-slate-950/20 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      🍏 iOS &amp; Safari Users:
                    </span>
                    <span className="text-[10px] text-slate-400 leading-normal">
                      Tap the share button <strong className="text-slate-600 dark:text-slate-300">📤 (Share)</strong> in Safari, scroll down, and select <strong className="text-slate-600 dark:text-slate-300">"Add to Home Screen"</strong>.
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/40 dark:bg-slate-950/20 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      🤖 Android, Chrome &amp; Edge:
                    </span>
                    <span className="text-[10px] text-slate-400 leading-normal">
                      Tap the browser menu <strong className="text-slate-600 dark:text-slate-300">⋮ (Settings)</strong>, click <strong className="text-slate-600 dark:text-slate-300">"Install Application"</strong>, or install via desktop action bars.
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ☁️ FIREBASE CLOUD SYNC & GOOGLE AUTHENTICATION CARD */}
      <motion.div
        id="firebase-auth-sync-panel"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[28px] p-5.5 border border-slate-100 dark:border-slate-800 shadow-3xs text-left mb-6"
      >
        <div className="flex items-center justify-between mb-4 border-b border-dashed border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-amber-500 animate-pulse" />
            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono font-bold">FlowSpace Cloud Sync</h3>
          </div>
          <div className="flex gap-1.5 flex-wrap font-mono text-[9px]">
            {user ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/15">
                Authenticated
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-450 font-bold border border-slate-500/15">
                Local Only
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-950/20 flex flex-col items-center sm:flex-row text-center sm:text-left gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full overflow-hidden border-2 border-[#6C3BFF] bg-slate-100 shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Google user'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={24} className="text-[#6C3BFF]" />
            )}
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white pb-0.5">
              {user ? `Welcome, ${user.displayName || 'Flow Scholar'}` : 'Secure Cloud Synchronization'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {user 
                ? `Signed in with ${user.email || ''}. All notes, habits, tracker statuses, and project boards are protected and synced in realtime.`
                : 'Connect your secure Google account. Instantly enable continuous automatic cloud backups, Multi-device collaboration on notes/boards, and permanent workspace protection.'}
            </p>
            {lastSyncedTime && (
              <p className="text-[9px] text-emerald-500 font-bold mt-1.5 font-mono">
                ✓ Cloud Synchronized at {lastSyncedTime}
              </p>
            )}
          </div>

          <div className="w-full sm:w-auto flex flex-col gap-2 shrink-0">
            {user ? (
              <>
                <button
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="w-full sm:w-44 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#6C3BFF] to-[#8B5CF6] hover:brightness-105 active:scale-95 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-white/10 disabled:opacity-50"
                >
                  <RefreshCcw size={13} className={`stroke-[2.5px] ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full sm:w-44 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-75 bg-opacity-10 text-rose-500 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-tiny"
                >
                  Logout Account
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                disabled={isSyncing}
                className="w-full sm:w-52 py-3 rounded-xl text-xs font-black bg-[#6C3BFF] hover:bg-violet-500 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-[0.99] border border-white/10"
              >
                <svg className="w-4 h-4 mr-1 shrink-0 bg-white p-0.5 rounded-full fill-current" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* 📥 SYNC, BACKUP & WORKSPACE EXPORT HUB */}
      <motion.div
        id="backup-recovery-panel"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[28px] p-5.5 border border-slate-100 dark:border-slate-800 shadow-3xs text-left"
      >
        <div className="flex items-center justify-between mb-4 border-b border-dashed border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sliders size={15} className={ACCENT_TEXT_MAP[profile.accentColor]} />
            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono font-bold">Backup & Recovery Hub</h3>
          </div>
          <span className="text-[9px] font-mono text-indigo-500 font-semibold uppercase tracking-wide">Client JSON Archiver</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* EXPORT WORKSPACE TRIGGER */}
          <div className="flex flex-col justify-between p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-950/20 text-left gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-850 dark:text-indigo-200 flex items-center gap-1.5">
                <FileText size={13} className="text-indigo-500" />
                <span>Export Active Workspace</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Archive your task lists, daily study agendas, completed focus pomodoros, personal notes, and streak charts into a portable workspace JSON.
              </p>
            </div>
            
            <button
              onClick={handleExportData}
              id="export-workspace-data-btn"
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#6C3BFF] hover:bg-violet-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-tiny shrink-0 hover:scale-101 active:scale-99 border border-white/5"
            >
              <Download size={13} />
              <span>Export Workspace Backup</span>
            </button>
          </div>

          {/* BACKUP RESTORE DROP TRIGGER */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-4.5 rounded-2xl border border-dashed transition-all flex flex-col justify-between gap-3 text-center ${
              dragActive 
                ? 'border-[#6C3BFF] bg-violet-500/5' 
                : 'border-slate-205 dark:border-slate-800 bg-slate-50/20 dark:bg-black/10'
            }`}
          >
            <div className="text-left flex flex-col gap-1">
              <h4 className="text-xs font-bold text-slate-850 dark:text-emerald-300 flex items-center gap-1.5">
                <Upload size={13} className="text-emerald-500" />
                <span>Restore Workspace Backup</span>
              </h4>
              <p className="text-[10px] text-slate-400 leading-normal mt-1">
                Drag & Drop a previously compiled backup file below or select manually from your device to restore all task and note matrices instantly.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImportFile(e.target.files[0]);
                  }
                }}
                accept=".json"
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                id="import-workspace-data-btn"
                className="w-full py-2.5 rounded-xl text-xs font-black bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border border-emerald-150 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-3D0 transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-101 active:scale-99"
              >
                <Upload size={13} />
                <span>Upload Backup File</span>
              </button>
            </div>
          </div>

        </div>
      </motion.div>

      {/* 💥 SEED ACTIONS PLAYGROUND */}
      <motion.div 
        id="actions-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-50/40 dark:bg-indigo-950/20 rounded-[28px] p-5.5 border border-indigo-100/50 dark:border-indigo-950/40 shadow-xs flex flex-col gap-3.5 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 rounded-full bg-indigo-100/30 dark:bg-indigo-950/20 blur-xl pointer-events-none" />
        
        <div>
          <h4 className="text-xs font-black tracking-widest text-[#6C3BFF] dark:text-indigo-400 flex items-center gap-1.5 font-mono uppercase">
            <Sparkles size={13} />
            <span>Interactive Playground</span>
          </h4>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            Quickly fill your workplace with pre-built focus plans, preset habits, and sample notes to test dynamic charts and filters instantly, or completely wipe clean.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={() => {
              onLoadDemoData();
              triggerSuccess('Demo preset seeded!');
            }}
            id="btn-load-demo-data"
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/50 text-[#6C3BFF] hover:text-white text-xs font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Sparkles size={12} />
            <span>Load Demo</span>
          </button>

          <button
            onClick={() => {
              onResetAll();
              triggerSuccess('Entire local storage cleared!');
            }}
            id="btn-wipe-reset-data"
            className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-650 dark:bg-rose-950/20 dark:hover:bg-rose-950/50 text-rose-700 hover:text-white dark:text-rose-450 border border-red-105 dark:border-rose-905/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Wipe Clean</span>
          </button>
        </div>
      </motion.div>

      {/* Bottom design credits (no slop, completely simple, clean, aesthetic) */}
      <div className="text-center py-4 text-[10px] text-slate-400 font-mono">
        FlowSpace AI • Plan • Focus • Achieve
      </div>

    </div>
  );
}
