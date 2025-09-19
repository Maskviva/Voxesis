<template>
  <div ref="switchComponent" class="component">
    <span ref="switchIcon" :class="['icon', { active: modelValue }]"></span>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const switchComponent = ref<HTMLElement>();
const switchIcon = ref<HTMLElement>();

const toggleSwitch = () => {
  const newValue = !props.modelValue;
  emit('update:modelValue', newValue);
  updateSwitchState(newValue);
};

const updateSwitchState = (value: boolean) => {
  if (switchIcon.value) switchIcon.value.classList.toggle("active", value);
};

watch(() => props.modelValue, (newVal) => updateSwitchState(newVal));

onMounted(() => {
  updateSwitchState(props.modelValue);
  switchComponent.value?.addEventListener("click", toggleSwitch);
});
</script>

<style scoped>
.component {
  width: 40px;
  height: 15px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: var(--color-background-card);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.icon {
  width: 12px;
  height: 12px;
  background-color: var(--color-border-default);
  border-radius: 50%;
  position: relative;
  left: 1px;
  transition: left 0.2s ease-in-out;
}

.icon.active {
  left: 25px;
}
</style>