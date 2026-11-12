<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskForm from '../components/TaskForm.vue';
import TaskListControls from '../components/TaskListControls.vue';
import { useProjectsStore } from '../store/projects.js';
import { useTasksStore } from '../store/tasks.js';
import '../css/task-components.css';
import '../css/task-list.css';

const taskStore = useTasksStore();
const projectStore = useProjectsStore();
const {
  tasks,
  searchText,
  selectedStatus,
  selectedPriority,
  selectedProject,
  sortOrder,
  onlyWithoutDueDate,
  totalTasks,
  completedTasks,
  visibleTasks,
} = storeToRefs(taskStore);
const { projects, projectStats } = storeToRefs(projectStore);

const showForm = ref(false);
const editingId = ref(null);
const newProjectTitle = ref('');
const projectError = ref('');

const completedPercent = computed(() => (
  totalTasks.value ? Math.round((completedTasks.value / totalTasks.value) * 100) : 0
));
const editingTask = computed(
  () => tasks.value.find((task) => task.id === editingId.value) ?? null,
);
const selectedProjectTitle = computed(
  () => projectStore.projectTitle(selectedProject.value),
);

function resetFilters() {
  taskStore.resetFilters();
}

function startCreate() {
  editingId.value = null;
  showForm.value = true;
}

function startEdit(id) {
  editingId.value = id;
  showForm.value = true;
}

function cancelForm() {
  editingId.value = null;
  showForm.value = false;
}

function saveTask(values) {
  const saved = values.id === null
    ? taskStore.addTask(values)
    : taskStore.updateTask(values);
  if (saved) cancelForm();
}

function handleDelete(id) {
  const task = tasks.value.find((item) => item.id === id);
  if (!task) return;

  const confirmed = window.confirm(`Видалити завдання «${task.title}»?`);
  if (!confirmed) return;

  if (taskStore.deleteTask(id) && editingId.value === id) {
    cancelForm();
  }
}

function createProject() {
  const result = projectStore.addProject(newProjectTitle.value);
  if (result.error) {
    projectError.value = result.error;
    return;
  }

  newProjectTitle.value = '';
  projectError.value = '';
  taskStore.setProjectFilter(result.project.id);
}

function moveSelectedProjectToProgress() {
  const count = tasks.value.filter(
    (task) => task.projectId === selectedProject.value && task.status !== 'progress',
  ).length;
  if (!count) {
    window.alert('Усі завдання цього проєкту вже мають статус «У роботі».');
    return;
  }

  const confirmed = window.confirm(
    `Перевести ${count} завдань проєкту «${selectedProjectTitle.value}» у статус «У роботі»?`,
  );
  if (confirmed) {
    taskStore.moveProjectTasksToProgress(selectedProject.value);
  }
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">TASKFLOW / TASK MANAGER</div>
        <h1>Керування завданнями</h1>
        <p>Спільний стан Pinia синхронізує завдання, фільтри та проєкти між сторінками.</p>

        <div class="tf3-stat-grid">
          <div class="tf3-stat">
            <span class="tf3-stat-label">Усього</span>
            <strong>{{ totalTasks }}</strong>
          </div>
          <div class="tf3-stat">
            <span class="tf3-stat-label">Виконано</span>
            <strong>{{ completedTasks }}</strong>
          </div>
          <div class="tf3-stat">
            <span class="tf3-stat-label">Виконано</span>
            <strong>{{ completedPercent }}%</strong>
          </div>
        </div>

        <button type="button" class="tf5-btn tf5-btn--primary tf5-new" @click="startCreate">
          + Додати завдання
        </button>
      </section>

      <TaskForm
        v-if="showForm"
        :key="editingId ?? 'new'"
        :task="editingTask"
        :projects="projects"
        @save="saveTask"
        @cancel="cancelForm"
      />

      <section class="tf5-panel tf6-project-panel" aria-label="Проєкти">
        <h2>Мої проєкти</h2>
        <div class="tf6-project-list">
          <div v-for="project in projectStats" :key="project.id" class="tf6-project-pill">
            <span>{{ project.title }}</span>
            <strong>{{ project.taskCount }}</strong>
            <span class="tf6-project-progress">
              {{ project.completionPercent }}% виконано
            </span>
          </div>
        </div>

        <form class="tf6-project-form" @submit.prevent="createProject">
          <label>
            Назва нового проєкту
            <input
              v-model="newProjectTitle"
              type="text"
              maxlength="40"
              placeholder="Наприклад: Лабораторні"
            />
          </label>
          <button type="submit" class="tf5-btn tf5-btn--primary">Створити проєкт</button>
        </form>
        <p v-if="projectError" class="tf5-error" role="alert">{{ projectError }}</p>
      </section>

      <TaskListControls
        v-model:search="searchText"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:sort="sortOrder"
        v-model:project="selectedProject"
        v-model:only-without-due-date="onlyWithoutDueDate"
        :projects="projects"
        @reset="resetFilters"
      />

      <div v-if="selectedProject !== 'all'" class="tf6-bulk-action">
        <span>Проєкт: <strong>{{ selectedProjectTitle }}</strong></span>
        <button type="button" class="tf5-btn" @click="moveSelectedProjectToProgress">
          Усі завдання проєкту — «У роботі»
        </button>
      </div>

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">TASK LIST</div>
            <h2>Список завдань</h2>
          </div>
          <div class="tf3-counter">
            Показано: {{ visibleTasks.length }} із {{ totalTasks }}
          </div>
        </div>

        <div v-if="visibleTasks.length" class="tf3-task-grid">
          <TaskCard
            v-for="task in visibleTasks"
            :key="task.id"
            :task="task"
            :project-title="projectStore.projectTitle(task.projectId)"
            @status-change="taskStore.setTaskStatus"
            @priority-change="taskStore.setTaskPriority"
            @edit="startEdit"
            @delete="handleDelete"
          />
        </div>

        <div v-else class="tf5-empty">
          <p>За поточними умовами завдань не знайдено.</p>
          <button type="button" class="tf5-btn" @click="resetFilters">
            Показати всі завдання
          </button>
        </div>
      </section>
    </div>

    <AppTabbar active="tasks" />
  </f7-page>
</template>
