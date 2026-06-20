import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" id="animated-workspace-bg">
      {/* 🔮 Soft dynamic gradient glowing blobs in the background */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-violet-600/10 via-purple-500/5 to-transparent blur-3xl opacity-70 animate-blob-1" 
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-transparent blur-3xl opacity-60 animate-blob-2" 
      />
      
      {/* ⚡ High efficiency glowing spots representing focus rays */}
      <div 
        className="absolute top-[25%] right-[20%] w-[250px] h-[250px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] animate-pulse" 
        style={{ animationDuration: '10s' }}
      />
      <div 
        className="absolute bottom-[35%] left-[15%] w-[300px] h-[300px] rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-[120px] animate-pulse" 
        style={{ animationDuration: '14s' }}
      />

      {/* 🌟 Floating active scholar particles (Uses lightweight CSS transforms) */}
      <div className="particle-bubble particle-1 w-2.5 h-2.5 left-[12%] opacity-30" style={{ animationDelay: '0s', animationDuration: '28s' }} />
      <div className="particle-bubble particle-1 w-1.5 h-1.5 left-[45%] opacity-20" style={{ animationDelay: '4s', animationDuration: '34s' }} />
      <div className="particle-bubble particle-2 w-2 h-2 left-[78%] opacity-25" style={{ animationDelay: '1s', animationDuration: '40s' }} />
      <div className="particle-bubble particle-1 w-3 h-3 left-[28%] opacity-15" style={{ animationDelay: '8s', animationDuration: '30s' }} />
      <div className="particle-bubble particle-2 w-1 h-1 left-[60%] opacity-35" style={{ animationDelay: '12s', animationDuration: '25s' }} />
      <div className="particle-bubble particle-2 w-2.5 h-2.5 left-[90%] opacity-20" style={{ animationDelay: '6s', animationDuration: '36s' }} />
      <div className="particle-bubble particle-1 w-2 h-2 left-[35%] opacity-25" style={{ animationDelay: '15s', animationDuration: '42s' }} />
    </div>
  );
}
