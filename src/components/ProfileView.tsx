import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  School, 
  BookOpen, 
  Award, 
  Upload, 
  Camera, 
  Check, 
  Edit3, 
  Sparkles, 
  Trophy, 
  Flame, 
  Clock, 
  CheckCircle2, 
  FileText,
  Trash2,
  Zap,
  TrendingUp,
  ChevronUp,
  RefreshCcw,
  LogOut
} from 'lucide-react';
import { UserProfile, Todo, Habit, Note } from '../types';

interface ProfileViewProps {
  profile: UserProfile;
  todos: Todo[];
  habits: Habit[];
  notes: Note[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  accentColor: string;
  user?: any;
  onLogin?: () => void;
  onLogout?: () => void;
  isSyncing?: boolean;
  onSyncNow?: () => void;
  lastSyncedTime?: string | null;
}

// Predefined fun academic motivational presets if no photo uploaded
const PHOTO_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80'
];

export default function ProfileView({
  profile,
  todos,
  habits,
  notes,
  onUpdateProfile,
  accentColor,
  user,
  onLogin,
  onLogout,
  isSyncing,
  onSyncNow,
  lastSyncedTime
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name || 'Prince Kumar');
  const [editSemester, setEditSemester] = useState(profile.semester || '6th Semester');
  const [editCollege, setEditCollege] = useState(profile.college || 'Engineering Institute of Technology');
  const [dragActive, setDragActive] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bonus XP interactively claims (stored in localStorage)
  const [bonusXP, setBonusXP] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('premium_gamified_bonus_xp') || '0');
    } catch {
      return 0;
    }
  });

  // Dynamic Metrics for achievement analysis
  const completedCount = todos.filter(t => t.completed).length;
  const focusMinutesTotal = (() => {
    try {
      const sessions = localStorage.getItem('completed_focus_sessions');
      if (sessions) {
        const parsed = JSON.parse(sessions);
        return parsed.reduce((sum: number, curr: any) => sum + (curr.minutes || 0), 0);
      }
    } catch (e) {}
    return 0;
  })();

  const activeHabitsCount = habits.length;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak), 0) : 0;
  const memoCount = notes.length;

  // XP Point and Leveling multipliers
  const xpFromTodos = completedCount * 120; // 120 XP per task completed
  const xpFromFocus = focusMinutesTotal * 15; // 15 XP per deep focus minute
  const xpFromHabits = habits.reduce((sum, h) => sum + (h.streak * 50), 0); // 50 XP per streak day
  const xpFromMemos = memoCount * 80; // 80 XP per knowledge sticky note
  const totalXP = xpFromTodos + xpFromFocus + xpFromHabits + xpFromMemos + bonusXP + 150; // 150 base XP

  // Progression calculation: 500 XP per Level
  const LEVEL_STEP = 500;
  const userLevel = Math.floor(totalXP / LEVEL_STEP) + 1;
  const currentLevelXP = totalXP % LEVEL_STEP;
  const progressPercent = Math.min((currentLevelXP / LEVEL_STEP) * 100, 100);

  // Claim interactive productivity bonus XP trigger
  const handleClaimBonus = () => {
    const originalLevel = Math.floor((totalXP) / LEVEL_STEP) + 1;
    const nextBonus = bonusXP + 100;
    const nextLevel = Math.floor((totalXP + 100) / LEVEL_STEP) + 1;
    
    setBonusXP(nextBonus);
    localStorage.setItem('premium_gamified_bonus_xp', String(nextBonus));
    setUpdateSuccess(true);
    
    if (nextLevel > originalLevel) {
      setJustLeveledUp(true);
      setTimeout(() => setJustLeveledUp(false), 4000);
    }
    setTimeout(() => setUpdateSuccess(false), 2000);
  };

  // Badge configuration lists
  const badges = [
    {
      id: 'streak_champ_7d',
      title: '7 Day Streak 🔥',
      desc: 'Demonstrate hyper consistency by maintaining a 7-day habit streak.',
      requirement: `Get a 7-day habit streak (Current: ${maxStreak}/7 Days)`,
      isUnlocked: maxStreak >= 7,
      category: 'habit',
      icon: <Flame className="w-5 h-5 text-rose-500 fill-rose-500/15" />
    },
    {
      id: 'focus_master_badge',
      title: 'Focus Master ⚡',
      desc: 'Master deep attention by logging 25 or more focus minutes.',
      requirement: `Focus for 25 mins (Current: ${focusMinutesTotal}/25 Mins)`,
      isUnlocked: focusMinutesTotal >= 25,
      category: 'timer',
      icon: <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500/15" />
    },
    {
      id: 'study_champion_badge',
      title: 'Study Champion 📚',
      desc: 'Establish solid study references by holding 3 or more dynamic sticky notes.',
      requirement: `Create 3 memos (Current: ${memoCount}/3 Memos)`,
      isUnlocked: memoCount >= 3,
      category: 'knowledge',
      icon: <BookOpen className="w-5 h-5 text-[#8B5CF6] fill-violet-500/15" />
    },
    {
      id: 'goal_crusher_badge',
      title: 'Goal Crusher 🎯',
      desc: 'Obliterate objectives by checking off 5 or more workspace tasks.',
      requirement: `Complete 5 tasks (Current: ${completedCount}/5 Tasks)`,
      isUnlocked: completedCount >= 5,
      category: 'productivity',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    },
    {
      id: 'scholar_prime',
      title: 'Active Scholar 🎓',
      desc: 'Enroll on active campus track by filling in university detail cards.',
      requirement: 'Provide semester and college information',
      isUnlocked: !!profile.semester && !!profile.college,
      category: 'academic',
      icon: <School className="w-5 h-5 text-indigo-500" />
    },
    {
      id: 'ultimate_grandmaster',
      title: 'Flow Ascendant 🏆',
      desc: 'Unlock all prior milestones to demonstrate absolute grandmaster flow state.',
      requirement: 'Clear all 5 primary focus achievements',
      isUnlocked: (!!profile.semester && !!profile.college) && (completedCount >= 5) && (focusMinutesTotal >= 25) && (maxStreak >= 7) && (memoCount >= 3),
      category: 'ultimate',
      icon: <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        onUpdateProfile({ photoUrl: reader.result as string });
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSelectPreset = (url: string) => {
    onUpdateProfile({ photoUrl: url });
    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 2000);
  };

  const handleClearPhoto = () => {
    onUpdateProfile({ photoUrl: undefined });
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: editName.trim(),
      semester: editSemester.trim(),
      college: editCollege.trim()
    });
    setIsEditing(false);
    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6" id="profile-view-root">
      
      {/* 🔮 PREMIUM GLASSMORPHISM CARD */}
      <motion.div 
        id="profile-hero-card"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl border border-white/20 dark:border-slate-800/40 bg-white/75 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 text-left shadow-lg"
      >
        {/* Glowing decorative ambient circular blobs in the background */}
        <div className="absolute top-0 right-0 -translate-x-4 -translate-y-4 w-44 h-44 rounded-full bg-[#6C3BFF]/10 dark:bg-[#6C3BFF]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-x-4 translate-y-4 w-32 h-32 rounded-full bg-indigo-500/10 dark:bg-fuchsia-500/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          {/* Circular avatar wrapper containing photo display */}
          <div className="relative group shrink-0" id="profile-photo-container">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-md bg-gradient-to-tr from-violet-100 to-indigo-100 flex items-center justify-center relative">
              {profile.photoUrl ? (
                <img 
                  src={profile.photoUrl} 
                  alt={profile.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-5xl">{profile.avatar || '🎓'}</span>
              )}
            </div>
            {/* Quick click photo upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#6C3BFF] hover:bg-violet-700 text-white shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
              title="Upload new image"
            >
              <Camera size={14} strokeWidth={2.5} />
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[#6C3BFF]/15 text-[#6C3BFF] dark:text-violet-300">
                <Sparkles size={11} className="animate-spin" />
                <span>Premium Flow Scholar</span>
              </div>
              
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-bounce">
                <TrendingUp size={11} />
                <span>Level {userLevel}</span>
              </div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
              {profile.name || 'Prince Kumar'}
            </h2>

            <div className="flex flex-col gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <p className="flex items-center justify-center sm:justify-start gap-1.5">
                <BookOpen size={13} className="text-slate-400 shrink-0" />
                <span>Semester: </span>
                <span className="text-slate-700 dark:text-slate-200">{profile.semester || '6th Semester'}</span>
              </p>
              <p className="flex items-center justify-center sm:justify-start gap-1.5">
                <School size={13} className="text-slate-400 shrink-0" />
                <span>College: </span>
                <span className="text-slate-700 dark:text-slate-200 truncate max-w-[280px]" title={profile.college}>
                  {profile.college || 'Engineering Institute of Technology'}
                </span>
              </p>
            </div>
          </div>

          {/* Edit & Gamification booster buttons */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setEditName(profile.name || 'Prince Kumar');
                setEditSemester(profile.semester || '6th Semester');
                setEditCollege(profile.college || 'Engineering Institute of Technology');
                setIsEditing(true);
              }}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-755 cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <Edit3 size={13} />
              <span>Edit Details</span>
            </button>

            <button
              onClick={handleClaimBonus}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white hover:brightness-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20"
              title="Claim +100 Bonus XP instantly"
            >
              <Zap size={13} className="fill-white text-white" />
              <span>Claim +100 XP</span>
            </button>

            {/* Google Firebase Sync trigger button */}
            {user ? (
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full">
                <button
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#6C3BFF] to-[#8B5CF6] hover:brightness-105 text-white active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-white/5 disabled:opacity-50"
                  title={lastSyncedTime ? `Last synced at ${lastSyncedTime}` : 'Force sync now'}
                >
                  <RefreshCcw size={13} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-755 cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                  title="Disconnect secure Google account"
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isSyncing}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-black transition-all bg-[#6C3BFF] text-white hover:bg-violet-700 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-white/5"
                title="Connect Google Profile and Cloud Synchronization"
              >
                <svg className="w-3.5 h-3.5 mr-0.5 shrink-0 bg-white p-0.5 rounded-full fill-current" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* 🏆 XP PROGRESS METER BAR */}
        <div className="mt-6 border-t border-slate-200/50 dark:border-slate-800/65 pt-6 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                Academic XP Meter
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                {totalXP} Total XP
              </span>
            </div>
            <span className="text-xs font-bold font-mono text-[#6C3BFF] dark:text-violet-400 bg-white dark:bg-slate-850 px-2 py-0.5 rounded-md shadow-3xs">
              {currentLevelXP} / {LEVEL_STEP} XP (Level {userLevel})
            </span>
          </div>
          
          {/* Progress Bar Track */}
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-950/60 rounded-full overflow-hidden p-0.5 border border-slate-205/30 dark:border-slate-850">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-[#6C3BFF] via-[#8B5CF6] to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            <span>Level {userLevel}</span>
            <span>{Math.round(LEVEL_STEP - currentLevelXP)} XP to next Level</span>
            <span>Level {userLevel + 1}</span>
          </div>
        </div>

        {/* Dynamic numerical mini summary bars below the user profile */}
        <div className="grid grid-cols-3 gap-3.5 border-t border-dashed border-slate-200/50 dark:border-slate-800/60 pt-5 mt-5">
          <div className="text-center p-2 rounded-2xl bg-slate-500/5 border border-slate-500/10">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold block">Tasks Done</span>
            <span className="text-base font-black tracking-tight font-mono text-slate-800 dark:text-white mt-1 block">
              {completedCount}
            </span>
          </div>
          <div className="text-center p-2 rounded-2xl bg-slate-500/5 border border-slate-500/10">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold block">Focus Time</span>
            <span className="text-base font-black tracking-tight font-mono text-slate-800 dark:text-white mt-1 block">
              {focusMinutesTotal} <span className="text-[10px] text-slate-400">min</span>
            </span>
          </div>
          <div className="text-center p-2 rounded-2xl bg-slate-500/5 border border-slate-500/10">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold block">Streaks</span>
            <span className="text-base font-black tracking-tight font-mono text-slate-800 dark:text-white mt-1 block">
              {maxStreak} <span className="text-[10px] text-slate-400">days</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* 🎓 PHOTO UPLOADER COLLAPSE BLOCK */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Photo Upload Zone (col-span-7) */}
        <div className="md:col-span-12 lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900/45 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 text-left h-full">
            <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
              <Upload size={15} className="text-[#6C3BFF]" />
              <span>Personalize Profile Photo</span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-450 leading-relaxed mb-4">
              Upload a snapshot of your choice, or select one of the high definition preloaded workspace scholar presets instantly.
            </p>

            {/* Direct Drag & Drop Active zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                dragActive 
                  ? 'border-[#6C3BFF] bg-violet-50/10 dark:bg-violet-950/10' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-[#6C3BFF] bg-slate-50/40 dark:bg-slate-950/20'
              }`}
              id="drop-target-section"
            >
              <Upload size={24} className="text-slate-400 animate-bounce" />
              <p className="text-xs font-bold text-slate-750 dark:text-slate-250">Drag & Drop Image Here</p>
              <p className="text-[10.5px] text-slate-400">or click to browse local files</p>
            </div>

            {/* Preset selectors row */}
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Academic Presets</span>
              <div className="flex items-center gap-2.5">
                {PHOTO_AVATARS.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => handleSelectPreset(url)}
                    className="w-10 h-10 rounded-xl overflow-hidden border border-slate-250 hover:border-[#6C3BFF] dark:border-slate-755 hover:scale-105 active:scale-95 cursor-pointer transition-all shrink-0"
                    title={`Select Sample Preset ${i+1}`}
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}

                {profile.photoUrl && (
                  <button
                    onClick={handleClearPhoto}
                    className="h-10 px-2.5 rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 text-[10px] font-bold cursor-pointer hover:scale-105 transition-all flex items-center gap-1 ml-auto"
                    title="Remove layout picture"
                  >
                    <Trash2 size={11} />
                    <span>Clear Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ACHIEVEMENTS GRID (col-span-12) */}
        <div className="md:col-span-12 lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900/45 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 text-left h-full flex flex-col">
            <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <Award size={15} className="text-amber-500" />
              <span>Academic Badges & Rewards</span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-450 leading-relaxed mb-4">
              Unlock gorgeous premium status milestones by staying persistent and clearing objectives on the dashboard daily.
            </p>

            {/* Badge list with conditional locking */}
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[340px] flex-1 pr-1.5 no-scrollbar">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 rounded-2xl border flex items-start gap-3 transition-all ${
                    b.isUnlocked 
                      ? 'bg-slate-50/100 border-slate-200/50 dark:bg-slate-900/30 dark:border-slate-800/60' 
                      : 'bg-slate-50/10 border-slate-200/20 dark:bg-slate-950/10 dark:border-slate-900/40 opacity-70'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${
                    b.isUnlocked 
                      ? 'bg-white dark:bg-slate-805 shadow-3xs' 
                      : 'bg-slate-100 dark:bg-slate-900'
                  }`}>
                    {b.isUnlocked ? b.icon : <span className="text-slate-350 dark:text-slate-600 block w-5 h-5 flex items-center justify-center text-xs">🔒</span>}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-[11px] font-bold truncate ${b.isUnlocked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-450'}`}>
                        {b.title}
                      </h4>
                      {b.isUnlocked && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider font-mono">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-[9.5px] text-slate-450 mt-0.5 leading-snug">{b.desc}</p>
                    <p className="text-[8.5px] font-mono text-slate-400 mt-1 font-semibold">{b.requirement}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 📌 POPUP PROFILE EDITOR DIALOG */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
            <motion.div 
              className="absolute inset-0 bg-transparent cursor-pointer" 
              onClick={() => setIsEditing(false)} 
            />

            <motion.div 
              id="edit-profile-modal"
              initial={{ y: '100%', opacity: 0.9 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.9 }}
              className="relative w-full max-w-sm rounded-t-3xl sm:rounded-[24px] bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 shadow-xl overflow-hidden z-10"
            >
              <div className="p-6 text-left">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-md font-bold tracking-tight text-slate-850 dark:text-white flex items-center gap-1.5 font-display">
                    <Edit3 size={15} />
                    <span>Academic Flow Profile</span>
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="p-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveChanges} className="flex flex-col gap-4">
                  {/* Name field */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prince Kumar"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Semester field */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                      Academic Semester
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 6th Semester"
                      value={editSemester}
                      onChange={(e) => setEditSemester(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* College field */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                      University / Institution
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MIT College"
                      value={editCollege}
                      onChange={(e) => setEditCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-tr from-violet-600 to-[#6C3BFF] text-white font-bold text-xs shadow-md shadow-violet-500/10 cursor-pointer hover:brightness-105 active:scale-95"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating alert/notification on successful profile save */}
      <AnimatePresence>
        {updateSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-755 text-white text-xs font-semibold px-4 py-2.5 rounded-full z-50 flex items-center gap-2 shadow-lg tracking-tight"
          >
            <Check size={14} className="text-emerald-400" strokeWidth={2.5} />
            <span>Profile details sync'd successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎉 LEVEL UP CELEBRATORY BANNER */}
      <AnimatePresence>
        {justLeveledUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-amber-400 rounded-3xl p-8 max-w-sm text-center shadow-2xl relative overflow-hidden"
              id="level-up-modal"
            >
              {/* Confetti-like ambient colors background */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#6C3BFF]/20 rounded-full blur-2xl" />

              <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                <ChevronUp className="w-10 h-10 text-white animate-bounce" strokeWidth={3} />
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                LEVEL UP! 📈
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Exceptional job, <span className="font-bold text-slate-800 dark:text-slate-200">{profile.name}</span>! You have successfully advanced to <span className="font-bold text-amber-600 dark:text-amber-400">Level {userLevel}</span> by reinforcing your study habits.
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-855 text-xs font-mono font-bold text-[#6C3BFF] dark:text-violet-400 mb-6">
                🏆 New Tier unlocked: Level {userLevel}
              </div>

              <button
                onClick={() => setJustLeveledUp(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C3BFF] to-[#8B5CF6] text-white text-xs font-bold shadow-md cursor-pointer hover:brightness-105 active:scale-95"
              >
                Continue Flow Mode
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
