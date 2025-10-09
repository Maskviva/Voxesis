<template>
  <div ref="switchComponent" class="component">
    <span ref="switchIcon" :class="['icon', { active: modelValue }]">
      <transition name="fade" mode="out-in">
        <IconCheckFill v-if="modelValue" fill="#595959" style="position: absolute; left: 5%; top: 5%"/>
        <IconCloseFill v-else fill="#595959" style="position: absolute; left: 5%; top: 5%"/>
      </transition>
    </span>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {IconCheckFill, IconCloseFill} from 'birdpaper-icon';

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
  width: 50px;
  height: 26px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: var(--color-background-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 15px;
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: var(--transition);
}

.component:hover {
  border-color: var(--color-border-hover);
}

.icon {
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  left: 3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.icon.active {
  left: 26px;
  background-color: var(--color-primary);
}

.component.active {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
  top: 0;
}

.fade-enter-from {
  opacity: 0.8;
  transform: scale(1.5);
}

.fade-leave-to {
  opacity: 0.8;
  transform: scale(0);
}
</style>