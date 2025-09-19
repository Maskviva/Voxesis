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
}

.input {
  width: 100%;
  height: 35px;

  margin: 0;
  padding: 7px 5px 5px;
  box-sizing: border-box;
  color: var(--color-text-primary);
  background-color: var(--color-background-card);
  border: 1px solid var(--color-border-default);
  border-radius: 5px 0 0 5px;
}

.input::placeholder {
  color: var(--color-text-secondary);
}

.btn {
  width: 45px;
  height: 35px;
  aspect-ratio: 1;

  margin: 0;
  padding: 0;
  box-sizing: border-box;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-primary);
  background-color: var(--color-background-menu);
  border: 1px solid var(--color-border-default);
  border-radius: 0 5px 5px 0;
  overflow: hidden;
}

.btn:hover {
  background-color: var(--color-background-menu-hover);
  border: 1px solid var(--color-border-default);
}

.btn:active {
  background-color: var(--color-background-menu-active);
}
</style>