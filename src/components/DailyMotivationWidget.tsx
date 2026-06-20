import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Quote } from 'lucide-react';

interface QuoteItem {
  text: string;
  author: string;
  category: 'Focus' | 'Consistency' | 'Zen' | 'Philosophy' | 'Action';
}

const PREMIUM_QUOTES: QuoteItem[] = [
  { text: "Consistency beats intensity every single time.", author: "James Clear", category: "Consistency" },
  { text: "Focus is a muscle, and you build it by ignoring the noise.", author: "Unknown", category: "Focus" },
  { text: "Deep work is not about working harder, it's about removing distraction.", author: "Cal Newport", category: "Focus" },
  { text: "One day or day one. You decide.", author: "Unknown", category: "Action" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh", category: "Consistency" },
  { text: "Your focus determines your reality.", author: "Qui-Gon Jinn", category: "Focus" },
  { text: "The outer world is a reflection of the inner kingdom.", author: "Stoic Proverb", category: "Zen" },
  { text: "Be like water making its way through cracks.", author: "Bruce Lee", category: "Zen" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", category: "Philosophy" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso", category: "Action" },
  { text: "Well begun is half done.", author: "Aristotle", category: "Philosophy" },
  { text: "The best way to predict the future is to create it.", author: "Abraham Lincoln", category: "Action" }
];

export default function DailyMotivationWidget() {
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [isRotating, setIsRotating] = useState(false);

  // Pick a random quote on mounting or keep persistent index
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * PREMIUM_QUOTES.length);
    setQuoteIndex(randomIndex);
  }, []);

  const handleNextQuote = () => {
    setIsRotating(true);
    
    // Choose a different quote
    let nextIndex = quoteIndex;
    while (nextIndex === quoteIndex && PREMIUM_QUOTES.length > 1) {
      nextIndex = Math.floor(Math.random() * PREMIUM_QUOTES.length);
    }
    
    // Trigger tiny audio click chime if Web Audio is supported
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime); // Hige A5 chime
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (_) {}

    setQuoteIndex(nextIndex);
    
    // Reset rotate icon trigger
    setTimeout(() => {
      setIsRotating(false);
    }, 600);
  };

  const activeQuote = PREMIUM_QUOTES[quoteIndex] || PREMIUM_QUOTES[0];

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Focus':
        return 'bg-violet-500/10 text-[#6C3BFF] border-violet-500/10';
      case 'Consistency':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/10';
      case 'Zen':
        return 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/10';
      case 'Philosophy':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/10';
      case 'Action':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/10';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/10';
    }
  };

  return (
    <div 
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-5.5 shadow-3xs text-left relative overflow-hidden transition-all flex flex-col justify-between"
      id="daily-motivation-widget-card"
    >
      {/* Decorative clean watermarks */}
      <div className="absolute right-[-14px] bottom-[-14px] text-slate-100 dark:text-slate-850 opacity-20 pointer-events-none">
        <Quote size={80} className="stroke-current fill-transparent" />
      </div>

      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Sparkles size={14} className="text-[#6C3BFF] animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-black tracking-tight text-slate-800 dark:text-white leading-none font-display">
              Zen Motivation
            </h3>
            <p className="text-[9px] text-slate-400 font-bold font-mono uppercase tracking-wider mt-0.5">
              Reflex Catalyst
            </p>
          </div>
        </div>

        {/* REFRESH ICON */}
        <button
          onClick={handleNextQuote}
          disabled={isRotating}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-105 dark:border-slate-850 text-slate-400 hover:text-slate-700 dark:hover:text-slate-205 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-3xs shrink-0 flex items-center justify-center disabled:opacity-50"
          title="Refresh quote"
          id="refresh-quote-btn"
        >
          <RefreshCw 
            size={12} 
            className={`transition-transform duration-500 ${isRotating ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* ANIMATED QUOTE MESSAGE */}
      <div className="flex-1 flex flex-col justify-center min-h-[75px] py-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-2"
          >
            <div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-mono font-black uppercase tracking-wider border ${getCategoryTheme(activeQuote.category)}`}>
                {activeQuote.category}
              </span>
            </div>
            
            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-100 leading-relaxed italic pr-4">
              "{activeQuote.text}"
            </p>
            
            <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider mt-0.5">
              — {activeQuote.author}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
