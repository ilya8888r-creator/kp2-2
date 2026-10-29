import { reactive } from 'vue';
import initialTasks from '../data/tasks.js';

const allowedStatuses = new Set(['todo', 'progress', 'done']);
const allowedPriorities = new Set(['low', 'medium', 'high']);

export const taskState = reactive({
  tasks: initialTasks.map((task) => ({ ...task })),
});

function findTask(id) {
  const task = taskState.tasks.find((item) => item.id === id);

  if (!task) {
    throw new RangeError(`Завдання з ідентифікатором ${id} не знайдено.`);
  }

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
