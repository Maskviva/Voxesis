<template>
  <div class="card">
    <div class="card-header">系统信息</div>
    <div class="card-content">
      <div class="system-info-item" v-for="info in systemInfo" :key="info.label">
        <div class="info-label">{{ info.label }}</div>
        <div class="info-value">{{ info.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface SystemInfoItem {
  label: string;
  value: string;
}

defineProps<{
  systemInfo: SystemInfoItem[];
}>();
</script>

<style scoped>
.card {
  background-color: var(--color-background-elevated);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-default);
  margin-bottom: var(--spacing-lg);
}

.card-header {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  border-bottom: 1px solid var(--color-border-secondary);
}

.card-content {
  padding: var(--spacing-lg);
}

.system-info-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border-secondary);
}

.system-info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  width: 100px;
  flex-shrink: 0;
}

.info-value {
  font-size: var(--font-size-sm);
  word-break: break-all;
  text-align: right;
}
</style>