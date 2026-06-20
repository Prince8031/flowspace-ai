import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  RefreshCcw, 
  Bot, 
  User, 
  Check, 
  Copy, 
  Plus, 
  ChevronDown, 
  BookOpen, 
  PlusCircle,
  HelpCircle,
  Terminal,
  Zap,
  StickyNote,
  Flame,
  ClipboardList,
  FlameKindling,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Todo, Habit, Note } from '../types';

interface AuraAssistantViewProps {
  todos: Todo[];
  notes: Note[];
  habits: Habit[];
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  onAddNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  accentColor: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionsPerformed?: {
    type: string;
    description: string;
  }[];
}

interface SuggestedTask {
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

interface ProductivityTip {
  title: string;
  category: string;
  body: string;
}

export default function AuraAssistantView({
  todos,
  notes,
  habits,
  onAddTodo,
  onAddNote,
  onAddHabit,
  accentColor
}: AuraAssistantViewProps) {
  // Navigation tabs inside Aura Workspace
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'tasks' | 'notes' | 'tips'>('chat');

  // Interactive Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am Aura, your premium AI workflow companion. I'm connected to your workspace and can help you organize your tasks, summarize verbose notes, and maintain peak focus streaks.\n\nTry telling me: 'Create a Study group event for tomorrow at 4 PM' or 'Set up a new daily reading habit.'",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  
  // Suggest Tasks State
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [createdSuggestions, setCreatedSuggestions] = useState<Record<string, boolean>>({});

  // Note Summarizer State
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [noteSummary, setNoteSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Productivity Tips State
  const [productivityTips, setProductivityTips] = useState<ProductivityTip[]>([
    {
      title: "Tactile Time-Blocking",
      category: "Focus Hacks",
      body: "Schedule fixed 45-minute study intervals separated by 5 minutes of standard stretching. Restriced physical pacing enhances executive decision-making."
    },
    {
      title: "Minimalist Backlog Pruning",
      category: "Workload Cleanse",
      body: "Filter pending tasks daily. Anything overdue by 72 hours should be deleted or reassigned to custom lists to resolve cognitive friction."
    },
    {
      title: "Mental Margin Rule",
      category: "Wellness Ritual",
      body: "Never schedule deep study blocks immediately following a high-stress meeting. Insert 10 minutes of complete sensory silence."
    }
  ]);
  const [isFetchingTips, setIsFetchingTips] = useState(false);

  // Notification overlay
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatSending]);

  // Unified pop notifications
  const triggerNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Acoustic click sound system
  const triggerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      }
    } catch (_) {}
  };

  // Handle manual message sends to Aura Chat
  const handleChatSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isChatSending) return;

    triggerBeep();
    const userMsg = inputMessage.trim();
    setInputMessage('');

    const newMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setIsChatSending(true);

    try {
      // Create message history matching the server-side expectations
      const history = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history })
      });

      if (!response.ok) {
        throw new Error(`Failed to consult Aura: ${response.status}`);
      }

      const reply = await response.json();
      
      const actionsExecuted: { type: string; description: string }[] = [];

      // Automatically execute parsed AI actions client side!
      if (reply.actions && Array.isArray(reply.actions)) {
        for (const act of reply.actions) {
          if (act.type === 'CREATE_TASK' && act.payload) {
            onAddTodo({
              title: act.payload.title,
              description: act.payload.description,
              category: act.payload.category || 'Personal',
              priority: act.payload.priority || 'medium',
              dueDate: act.payload.dueDate,
              time: act.payload.time,
              location: act.payload.location,
              folder: act.payload.folder,
              completed: false,
              subtasks: [],
              tags: act.payload.tags || []
            });
            actionsExecuted.push({
              type: 'Task Created',
              description: `"${act.payload.title}" verified for ${act.payload.dueDate || 'Inbox'}`
            });
          } else if (act.type === 'CREATE_NOTE' && act.payload) {
            onAddNote({
              title: act.payload.title,
              content: act.payload.content,
              color: act.payload.color || 'bg-white border-slate-150 text-slate-900',
              isPinned: false
            });
            actionsExecuted.push({
              type: 'Memo Created',
              description: `"${act.payload.title}" saved into Memos`
            });
          } else if (act.type === 'CREATE_HABIT' && act.payload) {
            onAddHabit({
              name: act.payload.name,
              description: act.payload.description,
              frequency: act.payload.frequency || 'daily',
              streak: 0,
              bestStreak: 0,
              history: {},
              color: act.payload.color || 'indigo',
              tags: []
            });
            actionsExecuted.push({
              type: 'Habit Registered',
              description: `Daily routine check configured for "${act.payload.name}"`
            });
          }
        }
      }

      const assistantMsg: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: reply.chatResponse || reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionsPerformed: actionsExecuted.length > 0 ? actionsExecuted : undefined
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (actionsExecuted.length > 0) {
        triggerNotification(`Aura automated ${actionsExecuted.length} updates successfully!`);
      }

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          content: "Sorry, I had some trouble processing that request. Please verify your GEMINI_API_KEY inside the Secrets panel on the top right bar.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Suggest personalized actionable tasks
  const handleSuggestTasks = async () => {
    setIsSuggesting(true);
    setSuggestError(null);
    try {
      const response = await fetch('/api/gemini/suggest-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todos })
      });

      if (!response.ok) {
        throw new Error(`Failed to suggestions: ${response.status}`);
      }

      const data = await response.json();
      if (data.suggestions) {
        setSuggestedTasks(data.suggestions);
        triggerBeep();
        triggerNotification("Aura calculated 4 custom backlogs relative to your active loads.");
      } else {
        setSuggestedTasks([]);
      }
    } catch (err: any) {
      console.error(err);
      setSuggestError("Unable to query task suggestions. Check your API secrets.");
    } finally {
      setIsSuggesting(false);
    }
  };

  // Handle adding suggested task instantly to main todos state
  const addSuggestedTask = (task: SuggestedTask, index: number) => {
    triggerBeep();
    onAddTodo({
      title: task.title,
      description: task.description || "Suggested by Aura AI.",
      category: task.category || "Work",
      priority: task.priority || "medium",
      completed: false,
      subtasks: []
    });

    setCreatedSuggestions(prev => ({ ...prev, [index]: true }));
    triggerNotification(`Added task: "${task.title}"`);
  };

  // Note Summarization Action handler
  const handleSummarizeNote = async () => {
    if (!selectedNoteId) return;
    const note = notes.find(n => n.id === selectedNoteId);
    if (!note) return;

    setIsSummarizing(true);
    setNoteSummary(null);
    setSummarizeError(null);
    setCopiedSummary(false);

    try {
      const response = await fetch('/api/gemini/summarize-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: note.title, content: note.content })
      });

      if (!response.ok) {
        throw new Error(`Failed to summarize: ${response.status}`);
      }

      const resData = await response.json();
      setNoteSummary(resData.summary);
      triggerBeep();
      triggerNotification("Memo condensed into a high-impact capsule summary!");
    } catch (err: any) {
      console.error(err);
      setSummarizeError("Could not generate summary. Check server keys.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopySummary = () => {
    if (!noteSummary) return;
    navigator.clipboard.writeText(noteSummary);
    setCopiedSummary(true);
    triggerBeep();
    triggerNotification("Summary copied to clipboard!");
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handlePinSummaryAsNote = () => {
    if (!noteSummary) return;
    const originalNote = notes.find(n => n.id === selectedNoteId);
    const title = originalNote ? `Digest: ${originalNote.title}` : 'Memo Digest Capsule';
    onAddNote({
      title,
      content: noteSummary,
      color: 'bg-violet-50 border-violet-100 text-violet-900',
      isPinned: true
    });
    triggerNotification("Digest saved as pinned Lavender Memo!");
  };

  // Pull fresh productivity insights
  const handleFetchProductivityTips = async () => {
    setIsFetchingTips(true);
    try {
      const response = await fetch('/api/gemini/productivity-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch tips: ${response.status}`);
      }
      const data = await response.json();
      if (data.tips && data.tips.length > 0) {
        setProductivityTips(data.tips);
        triggerBeep();
        triggerNotification("Weekly workflow optimization updated.");
      }
    } catch (err) {
      console.error("Failed to load new tips", err);
      // Keep existing static preview content so UI is never broken or blank
      triggerNotification("Using local backup productivity insights.");
    } finally {
      setIsFetchingTips(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-170px)] pb-16 relative">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl shadow-lg border text-xs font-bold z-55 flex items-center gap-2 ${
              notification.type === 'success' 
                ? 'bg-violet-500/10 dark:bg-violet-500/20 text-[#6C3BFF] dark:text-violet-400 border-violet-500/20' 
                : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}
          >
            <Sparkles size={14} className="animate-spin text-amber-500" />
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔮 HERO BRAND HEADER */}
      <div className="flex flex-col mb-6 bg-linear-to-r from-violet-600/5 to-fuchsia-600/5 dark:from-violet-500/5 dark:to-fuchsia-500/5 p-6.5 rounded-[32px] border border-violet-100/40 dark:border-slate-800/60 relative overflow-hidden backdrop-blur-3xs text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-tr from-[#6C3BFF]/10 to-transparent rounded-full blur-3xl -z-10 animate-pulse duration-[8000]" />
        
        <div className="flex items-center gap-2.5 pb-2">
          <div className="p-2.5 bg-gradient-to-tr from-[#6C3BFF] to-[#A855F7] text-white rounded-2xl shadow-md flex items-center justify-center animate-pulse">
            <Bot size={22} className="stroke-[2px] text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-850 dark:text-white uppercase font-sans">
              Aura <span className="bg-gradient-to-r from-[#6C3BFF] to-[#A855F7] bg-clip-text text-transparent">AI Assistant</span>
            </h1>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6C3BFF] dark:text-violet-400">
              Interactive Workflow Copilot
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed max-w-2xl mt-1">
          Aura is trained to analyze study schedules, condense lengthy notes, and perform structured actions in your personal organizer using plain human instructions.
        </p>

        {/* Action view switcher */}
        <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-1.25 rounded-2xl border border-slate-100 dark:border-slate-850 w-full max-w-md mt-5.5 font-sans font-bold text-xs">
          <button
            onClick={() => { setActiveSubTab('chat'); triggerBeep(); }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'chat' 
                ? 'bg-white dark:bg-slate-800 text-[#6C3BFF] dark:text-white shadow-tiny border border-slate-100 dark:border-slate-700' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Send size={13} />
            <span>AI Chat</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('tasks'); triggerBeep(); }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'tasks' 
                ? 'bg-white dark:bg-slate-800 text-[#6C3BFF] dark:text-white shadow-tiny border border-slate-100 dark:border-slate-700' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ClipboardList size={13} />
            <span>Suggest Tasks</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('notes'); triggerBeep(); }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'notes' 
                ? 'bg-white dark:bg-slate-800 text-[#6C3BFF] dark:text-white shadow-tiny border border-slate-100 dark:border-slate-700' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <StickyNote size={13} />
            <span>Memos Digest</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('tips'); triggerBeep(); }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'tips' 
                ? 'bg-white dark:bg-slate-800 text-[#6C3BFF] dark:text-white shadow-tiny border border-slate-100 dark:border-slate-700' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen size={13} />
            <span>Tips board</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* VIEW 1: COGNITIVE INTERACTOR CHAT AREA */}
        <div className={`col-span-12 ${activeSubTab === 'chat' ? 'lg:col-span-12' : 'lg:col-span-8'} transition-all`}>
          {activeSubTab === 'chat' && (
            <motion.div
              layoutId="aura-chat-panel"
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs rounded-[32px] p-5.5 flex flex-col min-h-[520px]"
            >
              {/* Top Banner inside Area */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#6C3BFF] font-bold dark:text-violet-400">
                    Aura Sync Core Live
                  </span>
                </div>
                <button 
                  onClick={() => {
                    triggerBeep();
                    setMessages([
                      {
                        id: 'welcome',
                        role: 'assistant',
                        content: "Conversational thread reset! Ready for fresh instructions. Ask me to schedule classes, organize chores, or compile study tips.",
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400 dark:text-slate-500 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                  title="Clear Chat History"
                >
                  <RefreshCcw size={13} />
                </button>
              </div>

              {/* Chat Thread Container */}
              <div className="flex-1 overflow-y-auto pr-1 max-h-[380px] min-h-[290px] flex flex-col gap-4.5 text-left custom-scrollbar scroll-smooth">
                {messages.map((m) => (
                  <div 
                    key={m.id}
                    className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                  >
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs border ${
                      m.role === 'user' 
                        ? 'bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300' 
                        : 'bg-gradient-to-tr from-[#6C3BFF] to-[#8B5CF6] text-white border-violet-500/20 shadow-tiny'
                    }`}>
                      {m.role === 'user' ? <User size={15} /> : <Bot size={15} className="text-white" />}
                    </div>

                    <div className="flex flex-col gap-1.25">
                      <div className={`px-4.5 py-3 rounded-2xl text-xs leading-relaxed border ${
                        m.role === 'user'
                          ? 'bg-[#6C3BFF] text-white border-violet-600/10 rounded-tr-none'
                          : 'bg-slate-50/75 dark:bg-slate-950/45 border-slate-100/40 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-tl-none whitespace-pre-wrap'
                      }`}>
                        {m.content}

                        {/* Executed Action chips */}
                        {m.actionsPerformed && (
                          <div className="mt-3 pt-3.5 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                            <p className="text-[9px] font-mono tracking-widest uppercase font-bold text-slate-400 dark:text-slate-500">
                              ⚡ FlowSpace Automated Creations
                            </p>
                            {m.actionsPerformed.map((act, i) => (
                              <div key={i} className="flex items-center gap-2 bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-150/45 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                <div className="text-[10px]">
                                  <strong className="text-slate-900 dark:text-white font-extrabold">{act.type}: </strong>
                                  <span className="text-slate-500 dark:text-slate-400">{act.description}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono px-1">
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {isChatSending && (
                  <div className="flex gap-3 max-w-[80%] self-start">
                    <div className="w-8 h-8 rounded-full bg-[#6C3BFF] shrink-0 flex items-center justify-center">
                      <Bot size={15} className="text-white animate-pulse" />
                    </div>
                    <div className="px-5 py-3.5 rounded-2xl text-xs bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-tl-none flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin text-[#6C3BFF]" />
                      <span className="text-slate-400 italic">Aura is consulting workflow guidelines...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleChatSend} className="mt-5 pt-4.5 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask Aura to write notes, create habits, or organize events..."
                  disabled={isChatSending}
                  className="flex-1 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl px-4.5 py-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#6C3BFF]/30 transition-all font-sans"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isChatSending}
                  className="px-5.5 py-3 bg-gradient-to-r from-[#6C3BFF] to-[#8B5CF6] text-white font-bold rounded-2xl hover:brightness-105 active:scale-95 transition-all text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer border border-white/5"
                >
                  <span>Send</span>
                  <Send size={13} />
                </button>
              </form>
            </motion.div>
          )}
        </div>

        {/* COMPONENT 2: INTELLIGENT CAPABILITIES LIST */}
        {activeSubTab === 'tasks' && (
          <div className="col-span-12">
            <motion.div
              layoutId="aura-tasks-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 shadow-2xs rounded-[32px] p-6 text-left"
            >
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                    <ClipboardList size={16} className="text-[#6C3BFF]" />
                    <span>Academic & Personal Task Recommendations</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Analyzing pending backlog and historical tasks to compute study milestones.
                  </p>
                </div>
                <button
                  onClick={handleSuggestTasks}
                  disabled={isSuggesting}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#6C3BFF] to-[#8B5CF6] hover:brightness-105 active:scale-97 cursor-pointer transition-all flex items-center gap-2 border border-white/5 disabled:opacity-50"
                >
                  <RefreshCcw size={13} className={isSuggesting ? 'animate-spin' : ''} />
                  <span>{isSuggesting ? "Evaluating..." : "Generate AI Tasks"}</span>
                </button>
              </div>

              {suggestError && (
                <p className="text-rose-500 font-bold text-[10px] font-mono bg-rose-500/10 p-3 rounded-xl border border-rose-500/15 mb-4 text-center">
                  ⚠️ {suggestError}
                </p>
              )}

              {suggestedTasks.length === 0 ? (
                <div className="p-8.5 rounded-3xl border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-950/20 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
                  <Terminal size={32} className="text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
                  <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest font-mono mb-1">
                    No Suggestions Loaded
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4 leading-normal">
                    Click "Generate AI Tasks" to run server-side workloads evaluation. We will analyze active tasks and offer specific recommendations.
                  </p>
                  <button
                    onClick={handleSuggestTasks}
                    disabled={isSuggesting}
                    className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-750 cursor-pointer transition-all"
                  >
                    Load Suggestion Engine
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestedTasks.map((task, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-950/30 flex flex-col justify-between hover:border-violet-500/20 hover:grid-bg-overlay transition-all"
                    >
                      <div className="pb-3 text-left">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5 font-mono text-[9px] uppercase font-black">
                          <span className={`px-2 py-0.5 rounded-full ${
                            task.category === 'Urgent' 
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                              : 'bg-violet-500/10 text-[#6C3BFF] border border-violet-500/15'
                          }`}>
                            {task.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            task.priority === 'high' 
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {task.priority} Priority
                          </span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-white leading-normal">
                          {task.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                          {task.description || "Action study sub-assignment."}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-dashed border-slate-100 dark:border-slate-850/60 flex items-center justify-end">
                        {createdSuggestions[idx] ? (
                          <span className="text-[10px] text-emerald-500 font-bold font-sans flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            <span>Added to Inbox</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => addSuggestedTask(task, idx)}
                            className="bg-[#6C3BFF]/9 py-1 px-3 rounded-lg text-[10px] font-extrabold text-[#6C3BFF] hover:bg-[#6C3BFF] hover:text-white transition-all cursor-pointer flex items-center gap-1 border border-violet-500/10"
                          >
                            <Plus size={11} className="stroke-[3px]" />
                            <span>Quick Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* VIEW 3: NOTE SUMMARIZATION MODULE */}
        {activeSubTab === 'notes' && (
          <div className="col-span-12">
            <motion.div
              layoutId="aura-notes-panel"
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs rounded-[32px] p-6 text-left"
            >
              <div className="pb-1 mb-5 border-b border-slate-50 dark:border-slate-850/60 pb-3">
                <h3 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                  <StickyNote size={16} className="text-[#6C3BFF]" />
                  <span>Aura Professional Memos Digest Summarizer</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Condense verbose meeting logs, research citations, or class notes into high-impact, actionable digest capsules.
                </p>
              </div>

              {notes.length === 0 ? (
                <div className="py-10 text-center max-w-sm mx-auto">
                  <StickyNote size={32} className="text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                  <p className="text-xs text-slate-400 font-sans">
                    You do not have any saved notes yet. Create a note in the Memos tab first!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Selector panel */}
                  <div className="md:col-span-4 flex flex-col gap-3">
                    <label className="text-[9px] font-mono tracking-widest uppercase font-extrabold text-slate-400 block pb-1">
                      Select Workspace Note
                    </label>
                    <div className="relative">
                      <select
                        value={selectedNoteId}
                        onChange={(e) => {
                          setSelectedNoteId(e.target.value);
                          setNoteSummary(null);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl p-3.5 pr-10 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-[#6C3BFF]/20 cursor-pointer appearance-none font-sans font-bold"
                      >
                        <option value="">-- Choose a Memo --</option>
                        {notes.map(n => (
                          <option key={n.id} value={n.id}>
                            {n.title || "Untitled Memo"}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <button
                      onClick={handleSummarizeNote}
                      disabled={!selectedNoteId || isSummarizing}
                      className="w-full py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#6C3BFF] to-[#8B5CF6] hover:brightness-105 active:scale-97 cursor-pointer transition-all flex items-center justify-center gap-1.5 border border-white/5 disabled:opacity-40"
                    >
                      {isSummarizing ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-white" />
                          <span>Summarizing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>Summarize Memo</span>
                        </>
                      )}
                    </button>
                    {summarizeError && (
                      <p className="text-rose-500 font-mono text-[9px] font-bold mt-1 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/10">
                        {summarizeError}
                      </p>
                    )}
                  </div>

                  {/* Summary outcome bubble */}
                  <div className="md:col-span-8">
                    <div className="border border-slate-100 dark:border-slate-850 p-5 rounded-2xl min-h-[160px] bg-slate-50/5 dark:bg-slate-950/25 relative flex flex-col justify-between">
                      <div className="text-left">
                        <span className="text-[9px] font-mono text-[#6C3BFF] dark:text-violet-400 uppercase font-black tracking-widest block pb-2.5">
                          ✓ Condensate Outcome Summary
                        </span>
                        
                        {noteSummary ? (
                          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-905 p-4 rounded-xl italic">
                            "{noteSummary}"
                          </p>
                        ) : (
                          <div className="py-6 text-center text-slate-400 text-[11px] flex flex-col items-center justify-center">
                            <Bot size={24} className="text-slate-300 dark:text-slate-800 mb-2 animate-bounce" />
                            <span>Select an existing note in the left panel and click Summarize Note to see results here.</span>
                          </div>
                        )}
                      </div>

                      {noteSummary && (
                        <div className="pt-3.5 border-t border-dashed border-slate-101 dark:border-slate-850/60 mt-3.5 flex justify-end gap-2 shrink-0">
                          <button
                            onClick={handleCopySummary}
                            className="bg-slate-100 hover:bg-slate-150 dark:bg-slate-800 p-2 rounded-xl text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center gap-1 text-[10px]"
                            title="Copy Digested summary"
                          >
                            <Copy size={12} />
                            <span>{copiedSummary ? "Copied" : "Copy"}</span>
                          </button>
                          <button
                            onClick={handlePinSummaryAsNote}
                            className="bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/15 text-[#6C3BFF] p-2 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            title="Save summary as a new pinned Note"
                          >
                            <Plus size={12} className="stroke-[3.5px]" />
                            <span>Pin Digest</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* VIEW 4: WEEKLY PRODUCTIVITY TIPS */}
        {activeSubTab === 'tips' && (
          <div className="col-span-12">
            <motion.div
              layoutId="aura-tips-panel"
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs rounded-[32px] p-6 text-left"
            >
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                    <BookOpen size={16} className="text-[#6C3BFF]" />
                    <span>Weekly Custom Productivity Tips</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Custom behavioral recommendations to elevate focus.
                  </p>
                </div>
                <button
                  onClick={handleFetchProductivityTips}
                  disabled={isFetchingTips}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-slate-800 dark:bg-slate-850 hover:bg-slate-900 cursor-pointer transition-all flex items-center gap-2 border border-slate-700/20 disabled:opacity-50"
                >
                  <RefreshCcw size={13} className={isFetchingTips ? 'animate-spin' : ''} />
                  <span>{isFetchingTips ? "Consulting..." : "Refresh Tips"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {productivityTips.map((tip, idx) => (
                  <div 
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/5 dark:bg-slate-950/20 text-left flex flex-col justify-between"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-[#6C3BFF] border border-violet-500/15 font-mono text-[8px] uppercase font-black block w-fit mb-3">
                        {tip.category}
                      </span>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {tip.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-2 leading-normal">
                        {tip.body}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-dashed border-slate-100 dark:border-slate-850/65 flex items-center gap-1.5 text-amber-500 font-mono text-[9px] uppercase font-black">
                      <Zap size={11} className="fill-amber-500 text-amber-500 animate-pulse animate-duration-1000" />
                      <span>Recommended study booster</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
