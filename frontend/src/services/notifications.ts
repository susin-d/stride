import { api } from './api';
import { NotificationItem } from '@/types';

export const notificationsService = {
  async getNotifications() {
    const res = await api.get<NotificationItem[]>('/notifications');
    return res.data;
  },

  async markAsRead(id: string) {
    const res = await api.patch<{ success: boolean }>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.patch<{ success: boolean }>('/notifications/read-all');
    return res.data;
  },
};
