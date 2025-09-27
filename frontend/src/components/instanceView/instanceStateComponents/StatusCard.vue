<template>
  <div class="card">
    <div class="card-header">状态</div>
    <div class="card-content">
      <StatusCircle
          v-for="status in statusList"
          :key="status.label"
          :percentage="status.percentage"
          :label="status.label"
          :detail="status.detail"
          :style="{ color: status.color }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusCircle from './StatusCircle.vue';

export interface StatusItem {
  percentage: number;
  label: string;
  detail: string;
  color: string;
}

defineProps<{
  statusList: StatusItem[];
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
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}
</style>