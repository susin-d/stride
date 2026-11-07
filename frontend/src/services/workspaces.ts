import { api } from './api';
import { Workspace } from '@/types';

export const workspacesService = {
  async getWorkspaces() {
    const res = await api.get<Workspace[]>('/workspaces');
    return res.data;
  },

  async createWorkspace(data: { name: string; color?: string }) {
    const res = await api.post<Workspace>('/workspaces', data);
    return res.data;
  },

  async updateWorkspace(id: string, data: { name?: string; color?: string }) {
    const res = await api.patch<Workspace>(`/workspaces/${id}`, data);
    return res.data;
  },

  async deleteWorkspace(id: string) {
    await api.delete(`/workspaces/${id}`);
  },
};
