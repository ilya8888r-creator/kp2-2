<script setup>
import { storeToRefs } from 'pinia';
import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import { useProjectsStore } from '../store/projects.js';
import { useTasksStore } from '../store/tasks.js';
import '../css/task-components.css';
import '../css/task-list.css';

const taskStore = useTasksStore();
const projectStore = useProjectsStore();
const { totalTasks, completedTasks, progressTasks, activeTasks } = storeToRefs(taskStore);
const { projectStats } = storeToRefs(projectStore);
</script>

<template>
  <f7-page name="home" class="tf3-page">
    <f7-navbar title="TaskFlow">
      <f7-nav-right>
        <f7-link href="/about/">Про застосунок</f7-link>
      </f7-nav-right>
    </f7-navbar>

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">TASKFLOW / DASHBOARD</div>
        <h1>Панель керування</h1>
        <p>Контролюйте виконання завдань та їхні пріоритети.</p>
      </section>

      <section class="tf3-stat-grid" aria-label="Статистика завдань">
        <div class="tf3-stat">
          <span class="tf3-stat-label">Усього завдань</span>
          <strong>{{ totalTasks }}</strong>
        </div>
        <div class="tf3-stat">
          <span class="tf3-stat-label">У роботі</span>
          <strong>{{ progressTasks }}</strong>
        </div>
        <div class="tf3-stat">
          <span class="tf3-stat-label">Виконано</span>
          <strong>{{ completedTasks }}</strong>
        </div>
      </section>

      <section class="tf5-panel tf6-project-panel" aria-label="Статистика проєктів">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">PROJECT OVERVIEW</div>
            <h2>Проєкти</h2>
          </div>
          <f7-button href="/tasks/" outline small>Керувати</f7-button>
        </div>
        <div class="tf6-home-projects">
          <div v-for="project in projectStats" :key="project.id" class="tf6-home-project">
            <div>
              <strong>{{ project.title }}</strong>
              <span>Невиконаних завдань: {{ project.incompleteCount }}</span>
            </div>
            <div class="tf6-home-progress" :aria-label="`${project.completionPercent}% виконано`">
              <div class="tf6-progress-track">
                <span :style="{ width: `${project.completionPercent}%` }"></span>
              </div>
              <strong>{{ project.completionPercent }}%</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">PRIORITY TASKS</div>
            <h2>Актуальні завдання</h2>
          </div>
          <f7-button href="/tasks/" outline small>Переглянути всі</f7-button>
        </div>

        <div v-if="activeTasks.length" class="tf3-task-grid">
          <TaskCard
            v-for="task in activeTasks"
            :key="task.id"
            :task="task"
            :project-title="projectStore.projectTitle(task.projectId)"
            :show-management-actions="false"
            @status-change="taskStore.setTaskStatus"
            @priority-change="taskStore.setTaskPriority"
          />
        </div>
        <div v-else class="tf3-empty">Наразі всі завдання виконані.</div>
      </section>
    </div>

    <AppTabbar active="home" />
  </f7-page>
</template>
