<template>
  <div
      class="status-item"
      :style="{ '--status-color': color }"
  >
    <div class="status-circle">
      <div
          class="status-circle-progress"
          :style="{ '--percent': `${animatedPercentage}%` }"
      ></div>
      <div class="status-percentage">{{ animatedPercentage.toFixed(2) }}%</div>
    </div>
    <div class="status-label">{{ label }}</div>
    <div class="status-detail">{{ detail }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  percentage: number;
  label: string;
  detail: string;
  color?: string;
}>(), {
  color: '#42b883'
});

const animatedPercentage = ref(0);

watch(() => props.percentage, (newValue) => {
  const animationDuration = 800;
  const frameRate = 60;
  const totalFrames = animationDuration / (1000 / frameRate);
  const startValue = animatedPercentage.value;
  const diff = newValue - startValue;

  let currentFrame = 0;

  const animate = () => {
    currentFrame++;
    const progress = currentFrame / totalFrames;
    const easeOutProgress = 1 - Math.pow(1 - progress, 3);

    animatedPercentage.value = startValue + diff * easeOutProgress;

    if (currentFrame < totalFrames) {
      requestAnimationFrame(animate);
    } else {
      animatedPercentage.value = newValue;
    }
  };

  animate();
});

</script>

<style scoped>
@property --percent {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-md, 16px);
  text-align: center;
  flex: 1;
  transition: transform 0.3s ease;
}

.status-item:hover {
  transform: translateY(-5px);
}

.status-circle {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-background);
  box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.06),
      0 4px 6px rgba(0, 0, 0, 0.1);
}

.status-circle-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--status-color) var(--percent), transparent 0);

  transition: --percent 0.8s ease-out;

  mask-image: radial-gradient(transparent 65%, black 65%);
}

.status-percentage {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text, #333);
  z-index: 1;
}

.status-label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-secondary, #555);
  margin-top: var(--spacing-sm, 12px);
  font-weight: 500;
}

.status-detail {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-text-tertiary, #777);
  margin-top: var(--spacing-xs, 4px);
}
</style>