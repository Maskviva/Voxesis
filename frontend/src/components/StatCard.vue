<template>
  <div class="card stat-card">
    <div class="stat-header">
      <h3 class="stat-title">{{ title }}</h3>
      <span class="badge" :class="badgeClass">{{ badgeText }}</span>
    </div>
    <div class="stat-content">
      <div class="stat-info">
        <p class="stat-value">{{ value }}</p>
        <p class="stat-desc">{{ description }}</p>
      </div>
      <div class="stat-icon-container" :class="iconContainerClass">
        <i class="stat-icon" :class="iconClass"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// 定义 props
const props = defineProps<{
  title: string;
  value: string;
  description: string;
  badgeText: string;
  badgeType: 'success' | 'info' | 'warning' | 'danger';
  iconClass: string;
}>();

// 根据 badgeType 动态计算 CSS 类名
const badgeClass = computed(() => `badge-${props.badgeType}`);
const iconContainerClass = computed(() => `icon-${props.badgeType}`);
</script>

<style scoped>
/* 样式从主组件中迁移并保持不变 */
.card {
  background-color: var(--color-background-card);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--card-shadow);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: var(--card-hover-shadow);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-success {
  background-color: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.badge-info {
  background-color: rgba(0, 123, 255, 0.2);
  color: #007bff;
}

.badge-warning {
  background-color: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.badge-danger {
  background-color: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 30px;
  font-weight: bold;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.stat-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.stat-icon-container {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-success {
  background-color: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.icon-info {
  background-color: rgba(0, 123, 255, 0.2);
  color: #007bff;
}

.icon-warning {
  background-color: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.icon-danger {
  background-color: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.stat-icon {
  font-size: 24px;
}
</style>