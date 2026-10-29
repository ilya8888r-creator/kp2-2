import { reactive } from 'vue';
import initialTasks from '../data/tasks.js';

const allowedStatuses = new Set(['todo', 'progress', 'done']);
const allowedPriorities = new Set(['low', 'medium', 'high']);

export const taskState = reactive({
  tasks: initialTasks.map((task) => ({ ...task })),
});

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00`);
  const normalizedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return !Number.isNaN(date.getTime()) && normalizedDate === value;
}

function normalizeTaskData(data) {
  if (!data || typeof data !== 'object') return null;

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const description = typeof data.description === 'string'
    ? data.description.trim()
    : '';

  if (title.length < 3 || title.length > 80) return null;
  if (description.length > 300) return null;
  if (!allowedStatuses.has(data.status)) return null;
  if (!allowedPriorities.has(data.priority)) return null;
  if (!isValidDate(data.dueDate)) return null;

  return {
    title,
    description,
    status: data.status,
    priority: data.priority,
    dueDate: data.dueDate,
  };
}

function findTask(id) {
  const task = taskState.tasks.find((item) => item.id === id);

  if (!task) {
    throw new RangeError(`Завдання з ідентифікатором ${id} не знайдено.`);
  }

  return task;
}

export function addTask(data) {
  const normalized = normalizeTaskData(data);
  if (!normalized) return null;

  const nextId = taskState.tasks.reduce(
    (maxId, task) => Math.max(maxId, task.id),
    0,
  ) + 1;
  const newTask = { id: nextId, ...normalized };

  taskState.tasks.push(newTask);
  return newTask;
}

export function updateTask({ id, ...data }) {
  const normalized = normalizeTaskData(data);
  if (!normalized) return null;

  const task = taskState.tasks.find((item) => item.id === id);
  if (!task) return null;

  Object.assign(task, normalized);
  return task;
}

export function setTaskStatus({ id, status }) {
  if (!allowedStatuses.has(status)) {
    throw new TypeError(`Непідтримуваний статус завдання: ${status}.`);
  }

  findTask(id).status = status;
}

export function setTaskPriority({ id, priority }) {
  if (!allowedPriorities.has(priority)) {
    throw new TypeError(`Непідтримуваний пріоритет завдання: ${priority}.`);
  }

  findTask(id).priority = priority;
}
