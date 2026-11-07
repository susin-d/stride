import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { tasksService } from '@/services/tasks';
import { projectsService } from '@/services/projects';
import { goalsService } from '@/services/goals';
import { habitsService } from '@/services/habits';
import { Task, Project, Goal, Habit } from '@/types';
import { Search, CheckSquare, Folder, Target, Flame, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SearchModal: React.FC = () => {
  const { searchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setTasks([]);
      setProjects([]);
      setGoals([]);
      setHabits([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [taskList, projectList, goalList, habitList] = await Promise.all([
          tasksService.getTasks({ search: query, limit: 5 }),
          projectsService.getProjects(),
          goalsService.getGoals(),
          habitsService.getHabits(),
        ]);

        setTasks(taskList);
        setProjects(
          projectList.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5)
        );
        setGoals(
          goalList.filter((g) =>
            g.title.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5)
        );
        setHabits(
          habitList.filter((h) =>
            h.name.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5)
        );
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!searchOpen) return null;

  const totalResults = tasks.length + projects.length + goals.length + habits.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => setSearchOpen(false)} />
      <div className="relative w-full max-w-xl neu-card dark:bg-[#18181B] overflow-hidden shadow-2xl z-10 border border-white/80 dark:border-white/10">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5">
          <Search className="w-5 h-5 text-secondary dark:text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder="Search tasks, projects, goals, habits... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm font-medium text-primary dark:text-neutral-100 placeholder:text-secondary dark:placeholder:text-neutral-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="text-center py-8 text-xs text-secondary dark:text-neutral-400 font-medium">
              Searching STRIDE database...
            </div>
          )}

          {!isLoading && query && totalResults === 0 && (
            <div className="text-center py-8 text-xs text-secondary dark:text-neutral-400">
              No results found for "{query}"
            </div>
          )}

          {!isLoading && tasks.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-secondary dark:text-neutral-400 uppercase px-2 mb-1.5 block">
                Tasks
              </span>
              <div className="space-y-1">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckSquare className="w-4 h-4 text-secondary dark:text-neutral-400 group-hover:text-primary dark:group-hover:text-neutral-100" />
                      <span className="text-xs font-medium text-primary dark:text-neutral-100">{task.title}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-secondary dark:text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && projects.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-secondary dark:text-neutral-400 uppercase px-2 mb-1.5 block">
                Projects
              </span>
              <div className="space-y-1">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/projects');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Folder className="w-4 h-4 text-secondary dark:text-neutral-400 group-hover:text-primary dark:group-hover:text-neutral-100" />
                      <span className="text-xs font-medium text-primary dark:text-neutral-100">{project.name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-secondary dark:text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && goals.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-secondary dark:text-neutral-400 uppercase px-2 mb-1.5 block">
                Goals
              </span>
              <div className="space-y-1">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/goals');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Target className="w-4 h-4 text-secondary dark:text-neutral-400 group-hover:text-primary dark:group-hover:text-neutral-100" />
                      <span className="text-xs font-medium text-primary dark:text-neutral-100">{goal.title}</span>
                    </div>
                    <span className="text-[11px] text-secondary dark:text-neutral-400 font-medium">
                      {goal.current_value}/{goal.target_value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && habits.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-secondary dark:text-neutral-400 uppercase px-2 mb-1.5 block">
                Habits
              </span>
              <div className="space-y-1">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/habits');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Flame className="w-4 h-4 text-secondary dark:text-neutral-400 group-hover:text-primary dark:group-hover:text-neutral-100" />
                      <span className="text-xs font-medium text-primary dark:text-neutral-100">{habit.name}</span>
                    </div>
                    <span className="text-[11px] text-secondary dark:text-neutral-400 font-medium">
                      {habit.streak} day streak
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!query && (
            <div className="py-6 text-center text-xs text-secondary dark:text-neutral-400">
              Type to search anything in STRIDE...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
