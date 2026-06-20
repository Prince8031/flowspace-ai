import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Clock, CheckCircle, Target, Sparkles } from 'lucide-react';

interface CompactStatsWidgetProps {
  isDarkMode: boolean;
  // Optional dynamic overrides if we want to hook into real app state cleanly
  streakOverride?: number;
  focusOverride?: string;
  tasksOverride?: number;
  productivityOverride?: number;
}

export default function CompactStatsWidget({
  isDarkMode,
  streakOverride,
  focusOverride,
  tasksOverride,
  productivityOverride
}: CompactStatsWidgetProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
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

  // Exact target values requested by prompt by default, with dynamic support if requested
  const streakCount = streakOverride !== undefined ? streakOverride : 12;
  const focusTime = focusOverride !== undefined ? focusOverride : "3h";
  const tasksDone = tasksOverride !== undefined ? tasksOverride : 7;
  const productivity = productivityOverride !== undefined ? productivityOverride : 92;

  const stats = [
    {
      label: 'Streak',
      value: `${streakCount} Day`,
      icon: <Flame className="w-5 h-5 text-amber-500 fill-amber-550/20" />,
      colorClass: 'from-amber-500 to-orange-550',
      emoji: '🔥'
    },
    {
      label: 'Focus',
      value: focusTime,
      icon: <Clock className="w-5 h-5 text-fuchsia-500" />,
      colorClass: 'from-fuchsia-500 to-purple-650',
      emoji: '⏳'
    },
    {
      label: 'Tasks Done',
      value: `${tasksDone} Done`,
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      colorClass: 'from-emerald-500 to-teal-555',
      emoji: '✅'
    },
    {
      label: 'Productivity',
      value: `${productivity}%`,
      icon: <Target className="w-5 h-5 text-rose-500" />,
      colorClass: 'from-rose-500 to-pink-550',
      emoji: '🎯'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-[24px] border p-5 text-left transition-all duration-500 cursor-pointer select-none group ${
        isDarkMode 
          ? 'bg-slate-900/40 border-slate-800/60 shadow-[0_8px_32px_0_rgba(15,23,42,0.25)] hover:border-[#6C3BFF]/45 hover:bg-slate-900/55' 
          : 'bg-white/45 backdrop-blur-xl border-slate-200/45 shadow-[0_8px_32px_0_rgba(108,59,255,0.03)] hover:border-[#6C3BFF]/35 hover:bg-white/60'
      }`}
      onPointerDown={handlePointerDown}
      id="compact-stats-glass-card"
    >
      {/* Glossy glare hover shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

      {/* Dynamic colorful backing blur orbs */}
      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-2xl pointer-events-none" />

      {/* Click Ripple overlay implementation (Framer motion) */}
      <span className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.28 }}
              animate={{ scale: 8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="absolute bg-[#6C3BFF]/20 dark:bg-violet-400/15 rounded-full"
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

      {/* Title block */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#6C3BFF] animate-pulse" />
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest font-sans">
            Core Performance Analytics
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[8px] font-bold font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Synced
          </span>
        </div>
      </div>

      {/* Compact dynamic grid for the requested metrics */}
      <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-4 gap-3 relative z-10">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`p-3 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 ${
              isDarkMode
                ? 'bg-slate-950/30 border-slate-800/80 hover:bg-slate-950/50 hover:border-[#6C3BFF]/25'
                : 'bg-white/35 border-slate-200/50 hover:bg-white/55 hover:border-[#6C3BFF]/15'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xl shrink-0 select-none">{stat.emoji}</span>
              <span className={`text-[8px] font-bold tracking-wider uppercase font-mono ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {stat.label}
              </span>
            </div>
            <div className="text-left mt-2">
              <span className="text-base font-black tracking-tight font-sans text-slate-800 dark:text-white">
                {stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
