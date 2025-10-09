<template>
  <div class="component">
    <input
        @input="numInput"
        class="input"
        :type="props.type"
        :min="props.min"
        :max="props.max"
        v-model="localValue"
        ref="input"
        :placeholder="props.placeholder"
        :maxlength="props.length"
    >
    <button class="btn" @click="back()">确定</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  type: "number" | "text" | "password";
  placeholder?: string;
  min?: number;
  max?: number;
  length?: number;
  modelValue?: string | number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();

const localValue = ref<string | number>(props.modelValue ?? '');

const numInput = (e: Event) => {
  if (props.type !== "number") return;
  const target = e.target as HTMLInputElement;
  let value: number = parseInt(target.value) || 0;

  if (props.min !== undefined && value < props.min) value = props.min;
  if (props.max !== undefined && value > props.max) value = props.max;

  localValue.value = value;
}

const back = () => {
  if (props.type === "number" && typeof localValue.value === 'string') {
    localValue.value = parseInt(localValue.value) || 0;
  }

  if (props.type === "number" && typeof localValue.value === 'number') {
    if (props.min !== undefined && localValue.value < props.min) localValue.value = props.min;
    if (props.max !== undefined && localValue.value > props.max) localValue.value = props.max;
  }

  emit('update:modelValue', localValue.value);
};

watch(() => props.modelValue, (newVal) => {
  if (newVal !== localValue.value) {
    localValue.value = newVal ?? '';
  }
})
</script>

<style scoped>
.component {
  width: 160px;
  height: 35px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.component:focus-within {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.input {
  width: 100%;
  height: 35px;
  margin: 0;
  padding: 7px 12px;
  box-sizing: border-box;
  color: var(--color-text);
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-right: none;
  border-radius: var(--border-radius) 0 0 var(--border-radius);
  font-family: inherit;
  font-size: 14px;
  transition: var(--transition);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.input::placeholder {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.btn {
  width: 55px;
  height: 35px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: white;
  background-color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
  transition: var(--transition);
}

.btn:hover {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn:active {
  transform: scale(0.98);
}
</style>