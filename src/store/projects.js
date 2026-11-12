import { defineStore } from 'pinia';
import { useTasksStore } from './tasks.js';

const initialProjects = [
  { id: 'general', title: 'Загальні' },
  { id: 'study', title: 'Навчання' },
  { id: 'personal', title: 'Особисті' },
];

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: initialProjects.map((project) => ({ ...project })),
    nextProjectId: 1,
  }),

  getters: {
    projectCount: (state) => state.projects.length,
    projectTitle: (state) => (id) => (
      state.projects.find((project) => project.id === id)?.title ?? 'Загальні'
    ),
    projectStats() {
      const { tasks } = useTasksStore();

      return this.projects.map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        const completedCount = projectTasks.filter((task) => task.status === 'done').length;
        const totalCount = projectTasks.length;

        return {
          ...project,
          taskCount: totalCount,
          incompleteCount: totalCount - completedCount,
          completedCount,
          completionPercent: totalCount
            ? Math.round((completedCount / totalCount) * 100)
            : 0,
        };
      });
    },
  },

  actions: {
    addProject(value) {
      const title = String(value ?? '').trim();
      if (title.length < 2 || title.length > 40) {
        return { error: 'Назва проєкту повинна містити від 2 до 40 символів.' };
      }

      const normalizedTitle = title.toLocaleLowerCase('uk-UA');
      const duplicate = this.projects.some(
        (project) => project.title.toLocaleLowerCase('uk-UA') === normalizedTitle,
      );
      if (duplicate) {
        return { error: 'Проєкт із такою назвою вже існує.' };
      }

      const project = { id: `project-${this.nextProjectId}`, title };
      this.nextProjectId += 1;
      this.projects.push(project);
      return { project };
    },
  },
});
