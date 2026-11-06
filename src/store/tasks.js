import { reactive } from 'vue';
import initialTasks from '../data/tasks.js';

const allowedStatuses = ['todo', 'progress', 'done'];
const allowedPriorities = ['low', 'medium', 'high'];

export const taskState = reactive({
  tasks: initialTasks.map((task) => ({ ...task })),
});

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

function normalizeValues(values) {
  if (!values || typeof values !== 'object') {
    return null;
  }

  const title = String(values.title ?? '').trim();
  const description = String(values.description ?? '').trim();
  const status = allowedStatuses.includes(values.status) ? values.status : 'todo';
  const priority = allowedPriorities.includes(values.priority) ? values.priority : 'medium';
  const dueDate = typeof values.dueDate === 'string' ? values.dueDate.trim() : '';

  return {
    title,
    description,
    status,
    priority,
    dueDate,
  };
}

function findTask(id) {
  return taskState.tasks.find((task) => task.id === Number(id));
}

export function addTask(values) {
  const taskValues = normalizeValues(values);
  if (!taskValues) return null;

  if (taskValues.title.length < 3 || taskValues.title.length > 80) return null;
  if (taskValues.description.length > 500) return null;
  if (!isValidDate(taskValues.dueDate)) return null;

  const nextId = taskState.tasks.reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1;
  const newTask = { id: nextId, ...taskValues };

  taskState.tasks.unshift(newTask);
  return newTask;
}

export function updateTask(values) {
  if (!values || typeof values !== 'object') return null;

  const { id, ...taskData } = values;
  const taskValues = normalizeValues(taskData);
  if (!taskValues) return null;

  const task = findTask(id);
  if (!task) return null;

  if (taskValues.title.length < 3 || taskValues.title.length > 80) return null;
  if (taskValues.description.length > 500) return null;
  if (!isValidDate(taskValues.dueDate)) return null;

  Object.assign(task, taskValues);
  return task;
}

export function setTaskStatus({ id, status }) {
  if (!allowedStatuses.includes(status)) return false;

  const task = findTask(id);
  if (!task) return false;

  task.status = status;
  return true;
}

export function setTaskPriority({ id, priority }) {
  if (!allowedPriorities.includes(priority)) return false;

  const task = findTask(id);
  if (!task) return false;

  task.priority = priority;
  return true;
}

export function deleteTask(id) {
  const index = taskState.tasks.findIndex((task) => task.id === Number(id));
  if (index === -1) return false;

  taskState.tasks.splice(index, 1);
  return true;
}
