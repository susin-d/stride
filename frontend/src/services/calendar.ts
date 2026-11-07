import { api } from './api';
import { CalendarEvent } from '@/types';

export const calendarService = {
  async getEvents(year?: number, month?: number) {
    const res = await api.get<CalendarEvent[]>('/calendar/events', {
      params: { year, month },
    });
    return res.data;
  },

  async createEvent(data: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    color?: string;
  }) {
    const res = await api.post<CalendarEvent>('/calendar/events', data);
    return res.data;
  },

  async updateEvent(id: string, data: Partial<CalendarEvent>) {
    const res = await api.patch<CalendarEvent>(`/calendar/events/${id}`, data);
    return res.data;
  },

  async deleteEvent(id: string) {
    await api.delete(`/calendar/events/${id}`);
  },
};
