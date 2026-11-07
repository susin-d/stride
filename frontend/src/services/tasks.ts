import { api } from './api';
import { Task, Subtask, Priority, TaskStatus } from '@/types';

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: Priority;
  project_id?: string;
  workspace_id?: string;
  due_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const tasksService = {
  async getTasks(params?: TaskFilterParams) {
    const res = await api.get<Task[]>('/tasks', { params });
    return res.data;
  },

  async getUpcomingTasks(days: number = 7) {
    const res = await api.get<Task[]>('/tasks/upcoming/list', { params: { days } });
    return res.data;
  },

  async getTask(id: string) {
    const res = await api.get<Task>(`/tasks/${id}`);
    return res.data;
  },

  async createTask(data: {
    title: string;
    description?: string;
    priority?: Priority;
    status?: TaskStatus;
    due_date?: string;
    due_time?: string;
    workspace_id?: string;
    project_id?: string;
  }) {
    const res = await api.post<Task>('/tasks', data);
    return res.data;
  },

  async updateTask(id: string, data: Partial<Task>) {
    const res = await api.patch<Task>(`/tasks/${id}`, data);
    return res.data;
  },

  async toggleComplete(id: string) {
    const res = await api.post<Task>(`/tasks/${id}/complete`);
    return res.data;
  },

  async deleteTask(id: string) {
    await api.delete(`/tasks/${id}`);
  },

  async addSubtask(taskId: string, title: string) {
    const res = await api.post<Subtask>(`/tasks/${taskId}/subtasks`, { title });
    return res.data;
  },
};
