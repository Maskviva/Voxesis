<template>
  <div class="card">
    <div class="card-header">玩家列表</div>
    <div class="card-content">
      <div class="stat-item" v-for="item in playersData" :key="item.label">
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface Player {
  label: string;
  value: number | string;
}

defineProps<{
  playersData: Player[];
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

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border-secondary);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}
</style>