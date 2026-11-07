import { api } from './api';
import { DashboardStats, WeeklyStats, ProductivityStats } from '@/types';

export const analyticsService = {
  async getDashboardStats() {
    const res = await api.get<DashboardStats>('/analytics/dashboard');
    return res.data;
  },

  async getWeeklyStats() {
    const res = await api.get<WeeklyStats>('/analytics/weekly');
    return res.data;
  },

  async getProductivityStats() {
    const res = await api.get<ProductivityStats>('/analytics/productivity');
    return res.data;
  },
};
