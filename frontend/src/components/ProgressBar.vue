<template>
  <div class="progress-bar" :style="{ height: props.height }" :data-progress="progress">
    <div class="progress"></div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';

const progress = ref(0);

const props = defineProps<{
  progress: number;
  height?: string;
}>();

watch(props, () => {
  progress.value = props.progress;
});
</script>

<style scoped>
.progress-bar {
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;

  position: relative;
}

.progress {
  height: 100%;
  width: v-bind(progress+ '%');
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 10px 0 0 10px;

  transition: all 0.3s ease-in-out;
}
</style>