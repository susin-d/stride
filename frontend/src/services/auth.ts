import { api } from './api';
import { User } from '@/types';

export const authService = {
  async register(data: { name: string; email: string; password: string; timezone?: string }) {
    const res = await api.post<{ access_token: string; user: User }>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post<{ access_token: string; user: User }>('/auth/login', data);
    return res.data;
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async getMe() {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  async updateMe(data: { name?: string; avatar_url?: string; timezone?: string }) {
    const res = await api.patch<User>('/auth/me', data);
    return res.data;
  },
};
