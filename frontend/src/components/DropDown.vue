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
  width: 160px;
  height: 35px;
  border-radius: 5px;
  padding: 10px;
  font-size: 13px;
  background-color: var(--color-background-card);
  color: var(--color-text-menu);
  border: 1px solid var(--color-border-default);
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  position: relative;
}

.drop {
  width: 100%;
  height: 100%;
  white-space: nowrap;
  transform: translateY(-3px);
}

.arrow {
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid currentColor;

  position: absolute;
  top: 40%;
  right: 5px;

  transition: transform 0.3s ease;
}

.drop-down-list.open ~ .arrow {
  transform: rotate(180deg);
}

.drop-down-list {
  width: 190px;
  height: 0;

  color: var(--color-text-menu);
  background-color: var(--color-background-menu);
  border-radius: 5px;
  opacity: 0.6;

  overflow: hidden;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.2);

  display: flex;
  flex-direction: column;

  position: absolute;
  top: calc(100% + 8px);
  left: 0;

  z-index: 99999;

  transition: all 500ms;
}

.drop-down::before {
  content: '';
  position: absolute;
  top: 35px;
  left: 10px;

  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid var(--color-background-menu-hover);

  opacity: 0;

  z-index: 100000;

  transition: opacity 0ms 380ms;
}

.drop-down:has(.drop-down-list.open)::before {
  opacity: 1;
  transition: opacity 0ms;
}

.drop-down-list.open {
  height: 130px;
  opacity: 1;
  overflow-y: auto;
}

.drop-down-list::-webkit-scrollbar {
  width: 8px;
}

.drop-down-list::-webkit-scrollbar-track {
  border-radius: 0 5px 5px 0;
  border-bottom: 8px solid var(--color-background-menu);
}

.drop-down-list::-webkit-scrollbar-thumb {
  background-color: var(--color-scrollbar-thumb);
  border-radius: 4px;
}

.drop-down-list::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-scrollbar-thumb-hover);
}

.item {
  width: 100%;
  height: 40px;
  padding: 10px;
  background-color: var(--color-background-menu);
  cursor: pointer;
}

.item:hover {
  background-color: var(--color-background-menu-hover);
}
</style>