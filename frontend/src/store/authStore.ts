import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('stride_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('stride_user');
    }
    set({ user, isAuthenticated: !!user });
  },

  setToken: (token) => {
    if (token) {
      localStorage.setItem('stride_access_token', token);
    } else {
      localStorage.removeItem('stride_access_token');
    }
    set({ token, isAuthenticated: !!token });
  },

  logout: () => {
    localStorage.removeItem('stride_access_token');
    localStorage.removeItem('stride_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  initAuth: () => {
    try {
      const storedToken = localStorage.getItem('stride_access_token');
      const storedUser = localStorage.getItem('stride_user');
      if (storedToken && storedUser) {
        set({
          token: storedToken,
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
