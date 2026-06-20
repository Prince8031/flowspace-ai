import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pin, 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  X, 
  Check, 
  Edit3,
  Calendar
} from 'lucide-react';
import { Note } from '../types';

interface NotesViewProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  onEditNote: (id: string, updated: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  accentColor: string;
}

const PASTEL_COLORS = [
  { name: 'Warm Yellow', value: 'bg-amber-50 border-amber-200 text-amber-900', checkBg: 'bg-amber-100', hex: '#fef3c7' },
  { name: 'Soft Blue', value: 'bg-sky-50 border-sky-100 text-sky-900', checkBg: 'bg-sky-100', hex: '#e0f2fe' },
  { name: 'Mint Green', value: 'bg-emerald-50 border-emerald-100 text-emerald-900', checkBg: 'bg-emerald-100', hex: '#d1fae5' },
  { name: 'Lavender Violet', value: 'bg-violet-50 border-violet-100 text-violet-900', checkBg: 'bg-violet-100', hex: '#ede9fe' },
  { name: 'Blush Pink', value: 'bg-rose-50 border-rose-100 text-rose-900', checkBg: 'bg-rose-100', hex: '#ffe4e6' },
  { name: 'Clean White', value: 'bg-white border-slate-150 text-slate-900', checkBg: 'bg-slate-100', hex: '#ffffff' }
];

const ACCENT_BG_MAP: Record<string, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  rose: 'bg-rose-500 hover:bg-rose-600 text-white',
  emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white',
  sky: 'bg-sky-500 hover:bg-sky-600 text-white',
  violet: 'bg-violet-600 hover:bg-violet-700 text-white'
};

export default function NotesView({
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  accentColor,
}: NotesViewProps) {
  const [searchText, setSearchText] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('bg-amber-50 border-amber-200 text-amber-900');
  const [notePinned, setNotePinned] = useState(false);

  // Grouping / filtering
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchText.toLowerCase()) || 
    n.content.toLowerCase().includes(searchText.toLowerCase())
  );

  // Pinned go first
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteColor('bg-amber-50 border-amber-200 text-amber-900');
    setNotePinned(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteColor(note.color);
    setNotePinned(note.isPinned);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    const actualTitle = noteTitle.trim() || 'Untitled Sticky Note';

    if (editingId) {
      onEditNote(editingId, {
        title: actualTitle,
        content: noteContent,
        color: noteColor,
        isPinned: notePinned
      });
    } else {
      onAddNote({
        title: actualTitle,
        content: noteContent,
        color: noteColor,
        isPinned: notePinned
      });
    }
    setIsFormOpen(false);
  };

  const togglePinInline = (note: Note) => {
    onEditNote(note.id, { isPinned: !note.isPinned });
  };

  return (
    <div className="flex flex-col gap-6" id="notes-view-root">
      
      {/* Search Header */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            id="notes-search-input"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search memo notes..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all shadow-2xs"
          />
          {searchText && (
            <button 
              onClick={() => setSearchText('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          onClick={handleOpenAdd}
          id="btn-add-note-inline"
          className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${ACCENT_BG_MAP[accentColor] || 'bg-indigo-600 text-white'}`}
        >
          <Plus size={16} />
          <span>New Note</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="flex flex-col gap-3.5" id="notes-masonry-container">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono px-1">
          Memos & Scratchpad ({sortedNotes.length})
        </h3>

        {sortedNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {sortedNotes.map((note) => {
                const colorConfig = PASTEL_COLORS.find(c => c.value === note.color) || PASTEL_COLORS[0];
                return (
                  <motion.div
                    key={note.id}
                    layout
                    id={`note-card-${note.id}`}
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: -8, transition: { duration: 0.15 } }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`p-5 rounded-3xl border flex flex-col justify-between min-h-[140px] shadow-2xs transition-all relative group ${note.color}`}
                  >
                    <div>
                      {/* Top Action Items & Pin */}
                      <div className="flex justify-between items-start mb-2.5 gap-2">
                        <h4 className="font-bold tracking-tight text-sm font-display leading-tight line-clamp-1 flex-1">
                          {note.title}
                        </h4>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => togglePinInline(note)}
                            id={`pin-note-btn-${note.id}`}
                            className={`p-1.5 rounded-full transition-colors ${
                              note.isPinned 
                                ? 'bg-slate-900/10 text-slate-930' 
                                : 'text-slate-400 hover:text-slate-600 group-hover:opacity-100'
                            }`}
                            title={note.isPinned ? "Unpin Note" : "Pin Note"}
                          >
                            <Pin size={13} className={note.isPinned ? "fill-current" : ""} />
                          </button>
                          
                          <button
                            onClick={() => handleOpenEdit(note)}
                            id={`edit-note-btn-${note.id}`}
                            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            title="Edit Note"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            onClick={() => onDeleteNote(note.id)}
                            id={`delete-note-btn-${note.id}`}
                            className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Note"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <p className={`text-xs leading-relaxed whitespace-pre-wrap break-words line-clamp-4 text-slate-700 font-light mb-4 transition-all duration-300 ${
                        localStorage.getItem('privacy_hide_notes') === 'true'
                          ? 'blur-[3px] hover:blur-none select-none cursor-help'
                          : ''
                      }`} title={localStorage.getItem('privacy_hide_notes') === 'true' ? "Hover to view note content" : ""}>
                        {note.content || <span className="italic text-slate-400">Empty memo body</span>}
                      </p>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="flex items-center justify-between pt-2 border-t border-black/[0.05] text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar size={10} />
                        <span>
                          {new Date(note.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        </span>
                      </span>
                      {note.isPinned && (
                        <span className="bg-slate-950/10 text-slate-800 px-1.5 py-0.5 rounded-md font-mono text-[9px] font-semibold tracking-wider uppercase">
                          Pinned
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-transparent border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center text-center text-slate-400 gap-2.5 my-3">
            <div className="p-3 bg-white rounded-full shadow-2xs text-slate-300">
              <FileText size={26} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">No notes found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                Capture quick drafts, copy pastes, ideas, or to-do summaries into high visibility color sticky notes!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 📌 Sticky Note Builder Modal (Slide-up or center) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
            <motion.div 
              className="absolute inset-0 bg-transparent" 
              onClick={() => setIsFormOpen(false)} 
            />

            <motion.div 
              id="note-form-modal"
              initial={{ y: '100%', opacity: 0.9 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden overflow-y-auto max-h-[85vh] z-10 border border-slate-100"
            >
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 sm:hidden" />

              <div className="px-5 pb-6 pt-2 sm:pt-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-bold tracking-tight text-slate-800 font-display">
                    {editingId ? 'Edit Memo' : 'New Memo'}
                  </h3>
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Note Title */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                      Memo Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 font-semibold text-slate-800 transition-all"
                      placeholder="e.g., Grocery quicklist ideas"
                      id="input-note-title"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                    />
                  </div>

                  {/* Note Content Textarea */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                      Body Content
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all resize-none"
                      placeholder="Type details, thoughts, link backlogs..."
                      value={noteContent}
                      id="input-note-content"
                      onChange={(e) => setNoteContent(e.target.value)}
                    />
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
                      Background Color Theme
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {PASTEL_COLORS.map(color => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setNoteColor(color.value)}
                          className={`w-9 h-9 rounded-full border relative flex items-center justify-center transition-transform hover:scale-110 active:scale-95`}
                          style={{ backgroundColor: color.hex }}
                        >
                          {noteColor === color.value && (
                            <motion.span 
                              layoutId="active-note-color"
                              className="text-slate-800"
                            >
                              <Check size={16} strokeWidth={2.5} />
                            </motion.span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pin Option */}
                  <div className="flex items-center gap-2 py-1">
                    <button
                      type="button"
                      onClick={() => setNotePinned(!notePinned)}
                      id="input-note-pin-toggle"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold tracking-tight transition-all ${
                        notePinned 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Pin size={13} className={notePinned ? 'fill-current' : ''} />
                      <span>{notePinned ? 'Pinned note' : 'Pin note to top'}</span>
                    </button>
                  </div>

                  {/* Submission */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="submit-note-button"
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer ${ACCENT_BG_MAP[accentColor] || 'bg-indigo-600 text-white'}`}
                    >
                      {editingId ? 'Save Edits' : 'Save Memo'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
