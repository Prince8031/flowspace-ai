import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Music, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  TreePine, 
  Layers, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume1,
  Compass
} from 'lucide-react';

interface SoundTrack {
  id: 'lofi' | 'rain' | 'forest' | 'meditation';
  title: string;
  category: string;
  badge: string;
  desc: string;
  color: string;
  bgGradient: string;
  icon: React.ReactNode;
}

export default function FocusMusicWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<'lofi' | 'rain' | 'forest' | 'meditation'>('lofi');
  const [volume, setVolume] = useState(50); // 0 to 100
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Web Audio Hook Handles
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  
  // Realtime visualizer animation states
  const [visualizerBars, setVisualizerBars] = useState<number[]>([15, 20, 15, 25, 30, 20, 15, 20, 25, 35, 20, 15]);

  const tracks: SoundTrack[] = [
    {
      id: 'lofi',
      title: 'Chill Lo-Fi Beats',
      category: 'Ambient Beat',
      badge: 'BPM 80',
      desc: 'Procedural lazy kick, crisp lo-fi shaker & mellow high-contrast electric keyboard loop.',
      color: 'from-violet-500 to-indigo-600',
      bgGradient: 'bg-gradient-to-r from-violet-500/10 to-indigo-600/10 text-violet-700 dark:text-violet-300',
      icon: <Music className="w-4 h-4 text-violet-600 dark:text-violet-400" />
    },
    {
      id: 'rain',
      title: 'Cozy Rain Shower',
      category: 'Natural ASMR',
      badge: 'White Noise',
      desc: 'Procedurally generated high-density rain fall using filtered pink noise and gentle sweeps.',
      color: 'from-[#6C3BFF] via-blue-600 to-indigo-600',
      bgGradient: 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300',
      icon: <CloudRain className="w-4 h-4 text-blue-500" />
    },
    {
      id: 'forest',
      title: 'Rustling Wilderness',
      category: 'Natural ASMR',
      badge: 'LFO Wind',
      desc: 'Soothing modulated forest canopy breezes mixed with soft synthesized dynamic bird chirps.',
      color: 'from-emerald-500 to-teal-600',
      bgGradient: 'bg-gradient-to-r from-emerald-500/10 to-teal-600/10 text-emerald-700 dark:text-emerald-300',
      icon: <TreePine className="w-4 h-4 text-emerald-500" />
    },
    {
      id: 'meditation',
      title: 'Solfeggio Healing',
      category: 'Zen Pad',
      badge: '432 Hz',
      desc: 'Sublime, peaceful synthesized resonant drone and deep harmony chord progression with infinite echoing trails.',
      color: 'from-amber-500 to-rose-500',
      bgGradient: 'bg-gradient-to-r from-amber-500/10 to-rose-500/10 text-amber-700 dark:text-amber-300',
      icon: <Layers className="w-4 h-4 text-amber-500" />
    }
  ];

  const activeTrackData = tracks.find(t => t.id === selectedTrack) || tracks[0];

  // Initialize or resume state
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      const ctx = new AudioCtx();
      const mainGain = ctx.createGain();
      mainGain.connect(ctx.destination);
      
      audioCtxRef.current = ctx;
      mainGainRef.current = mainGain;
    }
    
    // Ensure running state matches click
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return true;
  };

  // Synced real-time visualizer loops
  useEffect(() => {
    if (isPlaying) {
      const updateVisualizer = () => {
        setVisualizerBars(prev => 
          prev.map(() => {
            const baseMin = 10;
            const ampFactor = selectedTrack === 'lofi' ? 45 : selectedTrack === 'rain' ? 30 : 25;
            return Math.floor(Math.random() * ampFactor) + baseMin;
          })
        );
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setVisualizerBars([12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, selectedTrack]);

  // Handle active music synth changes
  useEffect(() => {
    if (isPlaying) {
      stopActiveSynthesizers();
      startActiveSynthesizer();
    } else {
      stopActiveSynthesizers();
    }
  }, [selectedTrack, isPlaying]);

  // Synced volumes
  useEffect(() => {
    if (mainGainRef.current && audioCtxRef.current) {
      const targetGain = isMuted ? 0 : volume / 100;
      mainGainRef.current.gain.linearRampToValueAtTime(targetGain * 0.45, audioCtxRef.current.currentTime + 0.1);
    }
  }, [volume, isMuted]);

  // Clean-up synthesisers on unmount
  useEffect(() => {
    return () => {
      stopActiveSynthesizers();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const togglePlayback = () => {
    const initiated = initAudio();
    if (!initiated) return;
    setIsPlaying(!isPlaying);
  };

  const stopActiveSynthesizers = () => {
    activeNodesRef.current.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        } else if (node.disconnect) {
          node.disconnect();
        }
      } catch (err) {}
    });
    activeNodesRef.current = [];
  };

  // HIGH FIDELITY SYNTHESIS ALGORITHMS (Web Audio API direct waveform procedural orchestration)
  const startActiveSynthesizer = () => {
    const ctx = audioCtxRef.current;
    const out = mainGainRef.current;
    if (!ctx || !out) return;

    if (selectedTrack === 'rain') {
      // PROCEDURAL HIGH DENSITY RAIN ENGINE (Filtered white/pink noise simulation)
      try {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink Filter approximation
          output[i] = (lastOut * 0.96) + (white * 0.035);
          lastOut = output[i];
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;

        // Dynamic wind/rain sweeping lowpass filter
        const filterNode = ctx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(650, ctx.currentTime);

        // Low frequency oscillator to simulate rain blow gusts
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // very slow sweep
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(250, ctx.currentTime);

        // Connect sweep filter
        lfo.connect(lfoGain);
        lfoGain.connect(filterNode.frequency);
        lfo.start();

        noiseNode.connect(filterNode);
        filterNode.connect(out);
        noiseNode.start();

        activeNodesRef.current.push(noiseNode, lfo, filterNode, lfoGain);
      } catch (e) {
        console.warn("Rain synthesis error", e);
      }
    } 
    
    else if (selectedTrack === 'forest') {
      // WILDERNESS CANOPY BREEZE & PROCEDURAL BIRD SONGS
      try {
        // 1. Breeze source (Modulated lowpass filtered pink noise)
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut * 0.93) + (white * 0.05);
          lastOut = output[i];
        }
        
        const breezeNode = ctx.createBufferSource();
        breezeNode.buffer = noiseBuffer;
        breezeNode.loop = true;

        const breezeFilter = ctx.createBiquadFilter();
        breezeFilter.type = 'bandpass';
        breezeFilter.frequency.setValueAtTime(280, ctx.currentTime);
        breezeFilter.Q.setValueAtTime(1.5, ctx.currentTime);

        const breezeLfo = ctx.createOscillator();
        breezeLfo.frequency.setValueAtTime(0.04, ctx.currentTime);
        const breezeLfoGain = ctx.createGain();
        breezeLfoGain.gain.setValueAtTime(120, ctx.currentTime);

        breezeLfo.connect(breezeLfoGain);
        breezeLfoGain.connect(breezeFilter.frequency);
        breezeLfo.start();

        const breezeVolume = ctx.createGain();
        breezeVolume.gain.setValueAtTime(0.6, ctx.currentTime);

        breezeNode.connect(breezeFilter);
        breezeFilter.connect(breezeVolume);
        breezeVolume.connect(out);
        breezeNode.start();

        activeNodesRef.current.push(breezeNode, breezeFilter, breezeLfo, breezeLfoGain, breezeVolume);

        // 2. Beautiful procedural bird chirping sequence timer
        const timerId = setInterval(() => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended' || !isPlaying || selectedTrack !== 'forest') {
            clearInterval(timerId);
            return;
          }

          // Trigger brief random beautiful bird chirp chord
          const now = ctx.currentTime;
          const duration = 0.15 + Math.random() * 0.18;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const birdGain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          
          const baseFreq = 2200 + Math.random() * 1500;
          osc1.frequency.setValueAtTime(baseFreq, now);
          osc1.frequency.exponentialRampToValueAtTime(baseFreq + 600, now + duration);

          osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
          osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.5 - 300, now + duration);

          birdGain.gain.setValueAtTime(0.0001, now);
          birdGain.gain.linearRampToValueAtTime(0.035, now + 0.02);
          birdGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          osc1.connect(birdGain);
          osc2.connect(birdGain);
          birdGain.connect(out);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + duration + 0.05);
          osc2.stop(now + duration + 0.05);
        }, 4500);

        // Store interval clean wrapper
        activeNodesRef.current.push({
          disconnect: () => clearInterval(timerId),
          stop: () => clearInterval(timerId)
        });

      } catch (e) {
        console.warn("Forest synthesis error", e);
      }
    } 
    
    else if (selectedTrack === 'meditation') {
      // SOLFEGGIO MINDFULNESS CHORDS (Continuous resonant drone playing beautiful harmonics in 432Hz tuning)
      try {
        const chordFreqs = [108, 216, 288, 324, 432, 540, 648]; // harmonic ratios of A=432Hz (Healing frequency)
        const drones: OscillatorNode[] = [];
        const gains: GainNode[] = [];

        const chordLfo = ctx.createOscillator();
        chordLfo.frequency.setValueAtTime(0.05, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.015, ctx.currentTime);
        chordLfo.connect(lfoGain);
        chordLfo.start();

        chordFreqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const pGain = ctx.createGain();
          
          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          
          // Entangle frequencies slightly to sound like warm acoustic pipe resonance
          osc.frequency.setValueAtTime(freq + (Math.random() * 0.8 - 0.4), ctx.currentTime);

          // Stagger amplitudes so low notes are deep, high notes are soft shimmering overlays
          const volumeScale = idx === 0 ? 0.35 : idx < 3 ? 0.25 : 0.08;
          pGain.gain.setValueAtTime(0.0001, ctx.currentTime);
          pGain.gain.linearRampToValueAtTime(volumeScale, ctx.currentTime + 3.0); // Gentle fade in over 3s

          // Bind sweeping subtle volume swells
          lfoGain.connect(pGain.gain);

          osc.connect(pGain);
          pGain.connect(out);
          osc.start();

          drones.push(osc);
          gains.push(pGain);
        });

        activeNodesRef.current.push(chordLfo, lfoGain, ...drones, ...gains);
      } catch (e) {
        console.warn("Meditation synthesis error", e);
      }
    } 
    
    else if (selectedTrack === 'lofi') {
      // CHILL LO-FI BEATS & VINYL DUST (Lo-Fi loop synthesiser)
      try {
        const now = ctx.currentTime;
        
        // 1. Vinyl static hiss sound for nostalgia vibe
        const bufferSize = ctx.sampleRate * 2;
        const dustBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const dustOut = dustBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Soft spikes representing vinyl dust pops
          dustOut[i] = white * 0.01 + (Math.random() > 0.9995 ? (Math.random() * 0.15 - 0.07) : 0);
        }
        const dustNode = ctx.createBufferSource();
        dustNode.buffer = dustBuffer;
        dustNode.loop = true;
        
        const dustFilter = ctx.createBiquadFilter();
        dustFilter.type = 'highpass';
        dustFilter.frequency.setValueAtTime(1000, now);

        const dustVol = ctx.createGain();
        dustVol.gain.setValueAtTime(0.18, now);

        dustNode.connect(dustFilter);
        dustFilter.connect(dustVol);
        dustVol.connect(out);
        dustNode.start();

        activeNodesRef.current.push(dustNode, dustFilter, dustVol);

        // 2. Loop timer playing procedural 80 BPM slow jazz progression
        // Chord sequence: Fmaj7 -> Cmaj7 -> Am7 -> Gsus4
        const jazzChords = [
          [174.61, 220.00, 261.63, 329.63], // Fmaj7
          [130.81, 164.81, 196.00, 261.63], // Cmaj7
          [110.00, 146.83, 174.61, 220.00], // Dm7
          [146.83, 196.00, 220.00, 293.66], // G7sus4
        ];
        
        let stepIndex = 0;
        const scheduleInterval = 3000; // 3 seconds per chord
        
        const playJazzStep = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended' || !isPlaying || selectedTrack !== 'lofi') {
            return;
          }

          const stepTime = ctx.currentTime;
          const chord = jazzChords[stepIndex % jazzChords.length];

          // Trigger cozy mellow electric piano chords (sine with soft dynamic attack and long decay)
          chord.forEach((freq, voiceIdx) => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, stepTime);
            
            // Soft key vintage tuning warp
            const detuneLfo = ctx.createOscillator();
            const detuneGain = ctx.createGain();
            detuneLfo.frequency.setValueAtTime(3 + voiceIdx, stepTime);
            detuneGain.gain.setValueAtTime(3, stepTime); // slightly warp
            detuneLfo.connect(detuneGain);
            detuneGain.connect(osc.frequency);
            detuneLfo.start(stepTime);

            // Mellow dynamic envelope
            noteGain.gain.setValueAtTime(0.0001, stepTime);
            noteGain.gain.linearRampToValueAtTime(0.14, stepTime + 0.15 + voiceIdx * 0.05); // slightly arpeggiated
            noteGain.gain.exponentialRampToValueAtTime(0.0001, stepTime + 2.7);

            osc.connect(noteGain);
            noteGain.connect(out);
            osc.start(stepTime);
            osc.stop(stepTime + 2.8);
            
            // Store cleanup
            activeNodesRef.current.push(detuneLfo, detuneGain, osc, noteGain);
          });

          // Trigger soft procedural lazy kick drum at 1.5 second intervals
          const playSoftKick = (kTime: number) => {
            const kickOsc = ctx.createOscillator();
            const kickGain = ctx.createGain();
            
            kickOsc.frequency.setValueAtTime(140, kTime);
            kickOsc.frequency.exponentialRampToValueAtTime(45, kTime + 0.15);
            
            kickGain.gain.setValueAtTime(0.25, kTime);
            kickGain.gain.exponentialRampToValueAtTime(0.0001, kTime + 0.22);
            
            kickOsc.connect(kickGain);
            kickGain.connect(out);
            kickOsc.start(kTime);
            kickOsc.stop(kTime + 0.25);

            activeNodesRef.current.push(kickOsc, kickGain);
          };

          // Play kick on beat 1 and beat 3
          playSoftKick(stepTime);
          playSoftKick(stepTime + 1.5);

          // Play a soft high-hat hiss on beat 2 and beat 4
          const playSoftHat = (hTime: number) => {
            // High-pass dynamic noise burst
            const hatOsc = ctx.createOscillator();
            const hatGain = ctx.createGain();
            hatOsc.type = 'triangle';
            hatOsc.frequency.setValueAtTime(12000, hTime);
            
            hatGain.gain.setValueAtTime(0.015, hTime);
            hatGain.gain.exponentialRampToValueAtTime(0.0001, hTime + 0.06);

            hatOsc.connect(hatGain);
            hatGain.connect(out);
            hatOsc.start(hTime);
            hatOsc.stop(hTime + 0.08);

            activeNodesRef.current.push(hatOsc, hatGain);
          };

          playSoftHat(stepTime + 0.75);
          playSoftHat(stepTime + 2.25);

          stepIndex++;
        };

        // Run instantly
        playJazzStep();
        const loopInterval = setInterval(playJazzStep, scheduleInterval);

        activeNodesRef.current.push({
          disconnect: () => clearInterval(loopInterval),
          stop: () => clearInterval(loopInterval)
        });

      } catch (e) {
        console.warn("Lo-Fi synthesis error", e);
      }
    }
  };

  const handleTrackChange = (trackId: 'lofi' | 'rain' | 'forest' | 'meditation') => {
    setSelectedTrack(trackId);
    // Auto start play on select track if not working
    if (!isPlaying) {
      const initiated = initAudio();
      if (initiated) {
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4.5 shadow-xs relative overflow-hidden" id="focus-music-widget-card">
      <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
        <Compass size={120} className="text-violet-600 animate-spin" style={{ animationDuration: '60s' }} />
      </div>

      {/* HEADER BAR AND TITLE */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Music size={15} className={`text-[#6C3BFF] ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-black tracking-tight text-slate-800 dark:text-white leading-tight font-display">
              Focus Sound Dock
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold font-mono">
              Procedural Ambient Stream
            </p>
          </div>
        </div>

        {/* Dynamic Interactive Mini Equalizer */}
        <div className="flex items-end gap-0.5 h-4.5 pr-1 select-none">
          {visualizerBars.map((h, index) => (
            <motion.div 
              key={index} 
              className={`w-[2.5px] rounded-full ${isPlaying ? 'bg-gradient-to-t from-violet-600 to-indigo-500 dark:from-violet-400 dark:to-indigo-300' : 'bg-slate-205 dark:bg-slate-800'}`} 
              animate={{ height: `${h}%` }}
              transition={{ type: 'tween', duration: 0.12 }}
            />
          ))}
        </div>
      </div>

      {/* MINI PLAYER BAR TRACK CONTROLS */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-855 flex items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <button 
            onClick={togglePlayback}
            className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center cursor-pointer text-white shadow-md active:scale-95 transition-all shrink-0 ${
              isPlaying 
                ? 'bg-[#6C3BFF] hover:bg-violet-700 shadow-violet-500/15'
                : 'bg-slate-800 dark:bg-slate-800 hover:bg-slate-900 shadow-slate-900/15'
            }`}
            id="audio-stream-toggle-button"
            title={isPlaying ? 'Pause ambient stream' : 'Play ambient stream'}
          >
            {isPlaying ? (
              <Pause size={13} className="fill-current" strokeWidth={2.5} />
            ) : (
              <Play size={13} className="fill-current ml-0.5" strokeWidth={2.5} />
            )}
          </button>
          
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] uppercase font-mono font-black tracking-wider px-1.5 py-0.5 rounded ${activeTrackData.bgGradient}`}>
                {activeTrackData.category}
              </span>
              <span className="text-[8px] font-mono text-slate-400 font-bold">
                {activeTrackData.badge}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-100 truncate mt-0.5">
              {activeTrackData.title}
            </h4>
          </div>
        </div>

        {/* Collapsible toggle expand button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-105 border border-slate-105 dark:border-slate-850 text-slate-400 hover:text-slate-700 dark:hover:text-slate-205 cursor-pointer transition-colors shadow-3xs"
          title={isExpanded ? "Hide tracks list" : "Show tracks list"}
        >
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* TRACK DETAILS DISPLAY (Expanded) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Tracks choices list */}
            <div className="grid grid-cols-2 gap-2 mt-3" id="soundtrack-channels">
              {tracks.map(track => {
                const isSelected = selectedTrack === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => handleTrackChange(track.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-20 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-tr from-violet-50/75 to-indigo-50/75 dark:from-violet-950/25 dark:to-indigo-950/25 border-violet-200 dark:border-violet-850 shadow-3xs ring-1 ring-violet-400/25'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-violet-600/10 text-violet-600 dark:text-violet-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        {track.icon}
                      </div>
                      
                      {isSelected && isPlaying && (
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500" />
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h5 className={`text-[10px] font-black tracking-tight leading-none ${isSelected ? 'text-violet-750 dark:text-violet-300 font-extrabold' : 'text-slate-700 dark:text-slate-350'}`}>
                        {track.title.split(' ')[1] || track.title}
                      </h5>
                      <p className="text-[8px] text-slate-400 dark:text-slate-500 font-mono font-bold mt-0.5 leading-none uppercase">
                        {track.badge}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Channel Narrative description card */}
            <div className="mt-3 p-3 rounded-2xl bg-slate-500/5 border border-slate-500/10 text-left">
              <p className="text-[9.5px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                {activeTrackData.desc}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DOCK INTEGRATED SLIDERS AND MUTING TOOLS */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-2 flex-1 max-w-[190px]">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-slate-750 dark:hover:text-slate-205 cursor-pointer"
            title={isMuted ? "Unmute stream" : "Mute stream"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={14} className="text-rose-500" />
            ) : volume < 35 ? (
              <Volume1 size={14} />
            ) : (
              <Volume2 size={14} />
            )}
          </button>

          {/* Styled native HTML input slider for optimal rendering performance */}
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600 dark:accent-violet-400"
            style={{
              background: `linear-gradient(to right, #6c3bff 0%, #6c3bff ${volume}%, ${localStorage.getItem('dark-mode') === 'true' ? '#1e293b' : '#f1f5f9'} ${volume}%, ${localStorage.getItem('dark-mode') === 'true' ? '#1e293b' : '#f1f5f9'} 100%)`
            }}
            id="volume-slider-focus-track"
          />
        </div>

        <span className="text-[9px] font-mono font-bold text-slate-400 select-none">
          {isMuted ? 'MUTED' : `${volume}% VOL`}
        </span>
      </div>
    </div>
  );
}
