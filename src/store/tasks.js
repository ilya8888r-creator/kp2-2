import { defineStore } from 'pinia';
import initialTasks from '../data/tasks.js';
import { useProjectsStore } from './projects.js';

const allowedStatuses = ['todo', 'progress', 'done'];
const allowedPriorities = ['low', 'medium', 'high'];
const priorityWeight = { high: 3, medium: 2, low: 1 };

function isValidDate(value) {
  if (typeof value !== 'string' || !value) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00`);
  const normalizedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return !Number.isNaN(date.getTime()) && normalizedDate === value;
}

function normalizeValues(values, projects) {
  if (!values || typeof values !== 'object') {
    return null;
  }

  const title = String(values.title ?? '').trim();
  const description = String(values.description ?? '').trim();
  const status = allowedStatuses.includes(values.status) ? values.status : 'todo';
  const priority = allowedPriorities.includes(values.priority) ? values.priority : 'medium';
  const dueDate = typeof values.dueDate === 'string' ? values.dueDate.trim() : '';
  const requestedProject = String(values.projectId ?? 'general');
  const projectId = projects.some((project) => project.id === requestedProject)
    ? requestedProject
    : null;

  if (!projectId) return null;
  if (title.length < 3 || title.length > 80) return null;
  if (description.length > 500) return null;
  if (!isValidDate(dueDate)) return null;

  return { title, description, status, priority, dueDate, projectId };
}

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: initialTasks.map((task) => ({
      ...task,
      projectId: task.projectId ?? 'general',
    })),
    searchText: '',
    selectedStatus: 'all',
    selectedPriority: 'all',
    selectedProject: 'all',
    sortOrder: 'newest',
    onlyWithoutDueDate: false,
  }),

  getters: {
    totalTasks: (state) => state.tasks.length,
    completedTasks: (state) => state.tasks.filter((task) => task.status === 'done').length,
    progressTasks: (state) => state.tasks.filter((task) => task.status === 'progress').length,
    activeTasks: (state) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };

      return state.tasks
        .filter((task) => task.status !== 'done')
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.id - a.id)
        .slice(0, 3);
    },
    visibleTasks: (state) => {
      const term = state.searchText.trim().toLocaleLowerCase('uk-UA');
      const filtered = state.tasks.filter((task) => {
        const preview = `${task.title} ${task.description ?? ''}`.toLocaleLowerCase('uk-UA');

        return (!term || preview.includes(term))
          && (state.selectedStatus === 'all' || task.status === state.selectedStatus)
          && (state.selectedPriority === 'all' || task.priority === state.selectedPriority)
          && (state.selectedProject === 'all' || task.projectId === state.selectedProject)
          && (!state.onlyWithoutDueDate || !task.dueDate);
      });

      return filtered.sort((a, b) => {
        if (state.sortOrder === 'title') {
          return a.title.localeCompare(b.title, 'uk-UA') || a.id - b.id;
        }

        if (state.sortOrder === 'priority') {
          return priorityWeight[b.priority] - priorityWeight[a.priority] || b.id - a.id;
        }

        if (state.sortOrder === 'dueDate') {
          const first = a.dueDate || '9999-12-31';
          const second = b.dueDate || '9999-12-31';
          return first.localeCompare(second) || b.id - a.id;
        }

        return b.id - a.id;
      });
    },
  },

  actions: {
    addTask(values) {
      const projects = useProjectsStore();
      const taskValues = normalizeValues(values, projects.projects);
      if (!taskValues) return null;

      const nextId = this.tasks.reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1;
      const task = { id: nextId, ...taskValues };
      this.tasks.unshift(task);
      return task;
    },

    updateTask(values) {
      if (!values || typeof values !== 'object') return null;

      const { id, ...taskData } = values;
      const projects = useProjectsStore();
      const taskValues = normalizeValues(taskData, projects.projects);
      if (!taskValues) return null;

      const task = this.tasks.find((item) => item.id === Number(id));
      if (!task) return null;

      Object.assign(task, taskValues);
      return task;
    },

    setTaskStatus({ id, status }) {
      if (!allowedStatuses.includes(status)) return false;

      const task = this.tasks.find((item) => item.id === Number(id));
      if (!task) return false;

      task.status = status;
      return true;
    },

    setTaskPriority({ id, priority }) {
      if (!allowedPriorities.includes(priority)) return false;

      const task = this.tasks.find((item) => item.id === Number(id));
      if (!task) return false;

      task.priority = priority;
      return true;
    },

    deleteTask(id) {
      const index = this.tasks.findIndex((task) => task.id === Number(id));
      if (index === -1) return false;

      this.tasks.splice(index, 1);
      return true;
    },

    setProjectFilter(projectId) {
      const projects = useProjectsStore();
      const isAvailable = projectId === 'all'
        || projects.projects.some((project) => project.id === projectId);

      if (!isAvailable) return false;
      this.selectedProject = projectId;
      return true;
    },

    moveProjectTasksToProgress(projectId) {
      const projects = useProjectsStore();
      if (!projects.projects.some((project) => project.id === projectId)) return 0;

      let updatedCount = 0;
      this.tasks.forEach((task) => {
        if (task.projectId === projectId && task.status !== 'progress') {
          task.status = 'progress';
          updatedCount += 1;
        }
      });
      return updatedCount;
    },

    resetFilters() {
      this.searchText = '';
      this.selectedStatus = 'all';
      this.selectedPriority = 'all';
      this.selectedProject = 'all';
      this.sortOrder = 'newest';
      this.onlyWithoutDueDate = false;
    },
  },
});
