<template>
  <div ref="dropDown" class="drop-down" @click="openDropDown()">
    <span class="drop">{{ selectedLabel || (props.placeholder || '请选择') }}</span>
    <div ref="dropDownList" class="drop-down-list">
            <span class="item" v-for="item in props.list" :key="item.value" @click="selectItem(item)">{{
                item.label
              }}</span>
    </div>
    <span ref="arrow" class="arrow"></span>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';

const props = defineProps<{
  value?: string;
  list: { label: string; value: string }[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:value', value: string): void;
}>();

const arrow = ref<HTMLElement | null>(null);
const dropDown = ref<HTMLElement | null>(null);
const dropDownList = ref<HTMLElement | null>(null);

const selectedLabel = computed(() => {
  const selectedItem = props.list.find(item => item.value === props.value);
  return selectedItem ? selectedItem.label : '';
});

const openDropDown = () => {
  if (dropDownList.value?.classList.contains('open')) dropDownList.value.classList.remove('open');
  else dropDownList.value?.classList.add('open');
};

const selectItem = (item: { label: string; value: string }) => {
  emit('update:value', item.value);
  dropDownList.value?.classList.remove('open');
};

document.addEventListener('click', (e) => {
  if (dropDown.value && !dropDown.value.contains(e.target as Node)) {
    dropDownList.value?.classList.remove('open');
  }
});
</script>

<style scoped>
.drop-down {
  width: 180px;
  height: 40px;
  border-radius: var(--border-radius);
  padding: 0 12px;
  font-size: 14px;
  background-color: var(--color-background-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  cursor: pointer;
  transition: var(--transition);
}

.drop-down:hover {
  border-color: var(--color-border-hover);
}

.drop-down:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.15);
}

.drop {
  width: calc(100% - 20px);
  height: 100%;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--color-text-secondary);
  transition: transform 0.3s ease;
}

.drop-down-list.open ~ .arrow {
  transform: rotate(180deg);
}

.drop-down-list {
  width: 100%;
  max-height: 0;
  color: var(--color-text);
  background-color: var(--color-background-elevated);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 1000;
  transition: all 0.3s ease;
}

.drop-down-list.open {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
}

.drop-down-list::-webkit-scrollbar {
  width: 6px;
}

.drop-down-list::-webkit-scrollbar-track {
  background: var(--color-background-secondary);
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
}

.drop-down-list::-webkit-scrollbar-thumb {
  background-color: var(--color-scrollbar-thumb);
  border-radius: 3px;
}

.drop-down-list::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-scrollbar-thumb-hover);
}

.item {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  background-color: var(--color-background-elevated);
  cursor: pointer;
  transition: var(--transition);
}

.item:hover {
  background-color: var(--color-background-secondary);
}

.item:active {
  background-color: var(--color-background-tertiary);
}
</style>