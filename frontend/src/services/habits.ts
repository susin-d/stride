import { api } from './api';
import { Habit, HabitLog, HabitFrequency } from '@/types';

export const habitsService = {
  async getHabits() {
    const res = await api.get<Habit[]>('/habits');
    return res.data;
  },

  async createHabit(data: {
    name: string;
    description?: string;
    frequency?: HabitFrequency;
    color?: string;
  }) {
    const res = await api.post<Habit>('/habits', data);
    return res.data;
  },

  async updateHabit(id: string, data: Partial<Habit>) {
    const res = await api.patch<Habit>(`/habits/${id}`, data);
    return res.data;
  },

  async deleteHabit(id: string) {
    await api.delete(`/habits/${id}`);
  },

  async toggleHabitLog(id: string, completion_date: string) {
    const res = await api.post<{ logged: boolean; date: string }>(`/habits/${id}/logs`, {
      completion_date,
    });
    return res.data;
  },

  async getHabitHistory(id: string) {
    const res = await api.get<HabitLog[]>(`/habits/${id}/history`);
    return res.data;
  },
};
