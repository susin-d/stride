import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type ThemeMode = 'light' | 'dark';

interface UIState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  searchOpen: boolean;
  createTaskModalOpen: boolean;
  createProjectModalOpen: boolean;
  createGoalModalOpen: boolean;
  createHabitModalOpen: boolean;
  createWorkspaceModalOpen: boolean;
  selectedWorkspaceId: string | null;
  toasts: Toast[];

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
  setCreateTaskModalOpen: (open: boolean) => void;
  setCreateProjectModalOpen: (open: boolean) => void;
  setCreateGoalModalOpen: (open: boolean) => void;
  setCreateHabitModalOpen: (open: boolean) => void;
  setCreateWorkspaceModalOpen: (open: boolean) => void;
  setSelectedWorkspaceId: (id: string | null) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('stride_theme') as ThemeMode;
  if (saved === 'dark' || saved === 'light') {
    if (saved === 'dark') document.documentElement.classList.add('dark');
    return saved;
  }
  return 'light';
};

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  sidebarOpen: false,
  searchOpen: false,
  createTaskModalOpen: false,
  createProjectModalOpen: false,
  createGoalModalOpen: false,
  createHabitModalOpen: false,
  createWorkspaceModalOpen: false,
  selectedWorkspaceId: null,
  toasts: [],

  setTheme: (theme) => {
    localStorage.setItem('stride_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('stride_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: next };
    });
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setCreateTaskModalOpen: (open) => set({ createTaskModalOpen: open }),
  setCreateProjectModalOpen: (open) => set({ createProjectModalOpen: open }),
  setCreateGoalModalOpen: (open) => set({ createGoalModalOpen: open }),
  setCreateHabitModalOpen: (open) => set({ createHabitModalOpen: open }),
  setCreateWorkspaceModalOpen: (open) => set({ createWorkspaceModalOpen: open }),
  setSelectedWorkspaceId: (id) => set({ selectedWorkspaceId: id }),

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
