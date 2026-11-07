import { api } from './api';
import { Project, ProjectStatus } from '@/types';

export const projectsService = {
  async getProjects() {
    const res = await api.get<Project[]>('/projects');
    return res.data;
  },

  async getProject(id: string) {
    const res = await api.get<Project>(`/projects/${id}`);
    return res.data;
  },

  async createProject(data: {
    name: string;
    description?: string;
    workspace_id?: string;
    deadline?: string;
    status?: ProjectStatus;
  }) {
    const res = await api.post<Project>('/projects', data);
    return res.data;
  },

  async updateProject(id: string, data: Partial<Project>) {
    const res = await api.patch<Project>(`/projects/${id}`, data);
    return res.data;
  },

  async deleteProject(id: string) {
    await api.delete(`/projects/${id}`);
  },
};
