import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '@/services/projects';
import { Project } from '@/types';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { FolderKanban, Plus, MoreVertical, Edit2, Trash2, Calendar, CheckSquare } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { formatShortDate } from '@/utils/dates';

export const ProjectsPage: React.FC = () => {
  const { setCreateProjectModalOpen, addToast } = useUIStore();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getProjects,
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await projectsService.deleteProject(id);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({ type: 'success', message: 'Project deleted' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete project' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary dark:text-neutral-100">Projects</h1>
            <p className="text-xs text-secondary dark:text-neutral-400 mt-0.5">
              Organize tasks into structured projects and track milestone progress.
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateProjectModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-md hover:bg-neutral-800 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="neu-card p-5 h-44 animate-pulse bg-surface/50" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="neu-card p-12 text-center text-xs text-secondary border-dashed">
          <FolderKanban className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
          <p className="font-semibold text-primary dark:text-neutral-100">No projects created yet</p>
          <p className="mt-1 dark:text-neutral-500">Group your tasks into projects to track your long-term roadmap.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
          {projects.map((project) => {
            const progress =
              project.task_count > 0
                ? Math.round((project.completed_task_count / project.task_count) * 100)
                : 0;

            return (
              <div
                key={project.id}
                onClick={() => setEditingProject(project)}
                className="neu-card p-5 flex flex-col justify-between hover:shadow-neu-raised transition-all cursor-pointer group relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-black/5 dark:bg-white/10 text-primary dark:text-neutral-200 rounded-md">
                      {project.status.replace('_', ' ')}
                    </span>

                    {/* Context menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === project.id ? null : project.id);
                        }}
                        className="p-1 text-secondary hover:text-primary rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {activeMenuId === project.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#1C1C20] rounded-xl shadow-lg border border-black/5 dark:border-white/10 py-1 z-20 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setEditingProject(project);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 text-left text-primary dark:text-neutral-200"
                          >
                            <Edit2 className="w-3 h-3 text-secondary" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              handleDelete(project.id, e);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left text-rose-600"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-primary dark:text-neutral-100 group-hover:underline">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-secondary dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Progress bar & metadata */}
                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-secondary dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      {project.completed_task_count} / {project.task_count} tasks
                    </span>
                    <span className="font-bold text-primary dark:text-neutral-100">{progress}%</span>
                  </div>

                  <div className="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary dark:bg-neutral-200 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {project.deadline && (
                    <div className="flex items-center gap-1 text-[10px] text-secondary dark:text-neutral-400 pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Due {formatShortDate(project.deadline)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectModal
        projectToEdit={editingProject}
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
      />
    </div>
  );
};
