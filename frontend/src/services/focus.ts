import { api } from './api';
import { FocusSession, FocusStatistics, SessionType, SessionStatus } from '@/types';

export const focusService = {
  async getSessions() {
    const res = await api.get<FocusSession[]>('/focus/sessions');
    return res.data;
  },

  async getActiveSession() {
    const res = await api.get<FocusSession | null>('/focus/active');
    return res.data;
  },

  async startSession(data: { session_type: SessionType; planned_duration: number }) {
    const res = await api.post<FocusSession>('/focus/sessions', data);
    return res.data;
  },

  async updateSession(id: string, data: { status?: SessionStatus; actual_duration?: number }) {
    const res = await api.patch<FocusSession>(`/focus/sessions/${id}`, data);
    return res.data;
  },

  async getStatistics() {
    const res = await api.get<FocusStatistics>('/focus/statistics');
    return res.data;
  },
};
