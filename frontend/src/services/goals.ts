import { api } from './api';
import { Goal, GoalStatus } from '@/types';

export const goalsService = {
  async getGoals() {
    const res = await api.get<Goal[]>('/goals');
    return res.data;
  },

  async createGoal(data: {
    title: string;
    description?: string;
    target_value: number;
    current_value?: number;
    deadline?: string;
  }) {
    const res = await api.post<Goal>('/goals', data);
    return res.data;
  },

  async updateGoal(id: string, data: Partial<Goal>) {
    const res = await api.patch<Goal>(`/goals/${id}`, data);
    return res.data;
  },

  async deleteGoal(id: string) {
    await api.delete(`/goals/${id}`);
  },
};
