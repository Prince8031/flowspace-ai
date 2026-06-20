export interface TodoSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  dueDate?: string;
  time?: string;
  location?: string;
  subtasks?: TodoSubtask[];
  tags?: string[];
  folder?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string; // Tailwind hex or class name
  createdAt: string;
  isPinned: boolean;
}

export interface UserProfile {
  name: string;
  avatar: string; // Emoji or asset
  dailyGoal: number; // number of completed tasks goal
  accentColor: string; // e.g. 'indigo', 'rose', 'emerald', 'amber', 'sky'
  showCompleted: boolean;
  semester?: string;
  college?: string;
  photoUrl?: string; // base64 or URL for custom profile photo
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  createdAt: string;
  streak: number;
  bestStreak: number;
  history: Record<string, boolean>; // key YYYY-MM-DD
  tags?: string[];
  color: string; // e.g. 'indigo', 'rose', 'emerald', 'amber', 'sky', 'violet'
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  status: 'todo' | 'progress' | 'review' | 'done';
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'planning';
  deadline?: string;
  progress: number; // 0-100
  color: string; // e.g. 'indigo', 'rose', 'emerald', 'amber', 'sky', 'violet'
  tasks: ProjectTask[];
  category?: string;
}


