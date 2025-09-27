<template>
  <div ref="windowRef" class="window" :class="{ 'maximized': winMaxSize }">
    <header class="window-header" ref="windowHeaderRef" @dblclick="winToggleMaximise()"
            :class="{ 'disabled': winMaxSize }">
      <div class="window-header-title">
        {{ title }}
      </div>
      <div class="window-header-btn">
        <a class="" @click="winToggleMaximise()">
          <component
              :is="!winMaxSize ? BirdpaperIcon.IconCheckboxBlankLine : BirdpaperIcon.IconCheckboxMultipleBlankLine"/>
        </a>
        <a class="" @click="closeWin()">
          <BirdpaperIcon.IconCloseLargeLine/>
        </a>
      </div>
    </header>

    <div class="window-content">
      <slot></slot>
    </div>

    <div v-if="!winMaxSize" class="resize-handle resize-nw" @mousedown="startResize('nw', $event)"></div>
    <div v-if="!winMaxSize" class="resize-handle resize-ne" @mousedown="startResize('ne', $event)"></div>
    <div v-if="!winMaxSize" class="resize-handle resize-sw" @mousedown="startResize('sw', $event)"></div>
    <div v-if="!winMaxSize" class="resize-handle resize-se" @mousedown="startResize('se', $event)"></div>
    <div v-if="!winMaxSize" class="resize-handle resize-n" @mousedown="startResize('n', $event)"></div>
    <div v-if="!winMaxSize" class="resize-handle resize-s" @mousedown="startResize('s', $event)"></div>
    <div v-if="!winMaxSize" class="resize-handle resize-w" @mousedown="startResize('w', $event)"></div>
    <div v-if="!winMaxSize" class="resize-handle resize-e" @mousedown="startResize('e', $event)"></div>
  </div>
</template>

<script lang="ts" setup>
import {nextTick, onMounted, onUnmounted, ref} from "vue";
import * as BirdpaperIcon from "birdpaper-icon";

const props = defineProps<{
  id: string;
  title: string;
}>()

const emit = defineEmits(["closed"]);

const windowRef = ref<HTMLDivElement>()
const windowHeaderRef = ref<HTMLDivElement>()
const winMaxSize = ref(false)
const windowSize = ref({
  width: 0,
  height: 0,
  left: 0,
  top: 0
})

let isDragging = false
let startX = 0, startY = 0
let startLeft = 0, startTop = 0

let isResizing = false
let resizeDirection = ''
let startWidth = 0, startHeight = 0
let startResizeLeft = 0, startResizeTop = 0

let mouseMoveListener: ((e: MouseEvent) => void) | null = null;
let mouseUpListener: (() => void) | null = null;

const winToggleMaximise = () => {
  if (!windowRef.value) return;

  if (!winMaxSize.value) {
    windowSize.value = {
      width: windowRef.value.offsetWidth,
      height: windowRef.value.offsetHeight,
      left: windowRef.value.offsetLeft,
      top: windowRef.value.offsetTop
    };

    windowRef.value.style.width = "100%";
    windowRef.value.style.height = "100%";
    windowRef.value.style.left = "0";
    windowRef.value.style.top = "0";
  } else {
    windowRef.value.style.width = windowSize.value.width + "px";
    windowRef.value.style.height = windowSize.value.height + "px";
    windowRef.value.style.left = windowSize.value.left + "px";
    windowRef.value.style.top = windowSize.value.top + "px";
  }

  winMaxSize.value = !winMaxSize.value
}

const closeWin = () => {
  cleanupEventListeners();

  if (windowRef.value && windowRef.value.parentNode) {
    windowRef.value.parentNode.removeChild(windowRef.value)
  }

  emit("closed", props.id);
}

const cleanupEventListeners = () => {
  if (mouseMoveListener) {
    document.removeEventListener('mousemove', mouseMoveListener);
  }
  if (mouseUpListener) {
    document.removeEventListener('mouseup', mouseUpListener);
  }

  document.removeEventListener('mousemove', resizeWindow);
  document.removeEventListener('mouseup', stopResize);
}

const startResize = (direction: string, e: MouseEvent) => {
  if (!windowRef.value || winMaxSize.value) return;

  e.preventDefault();
  isResizing = true;
  resizeDirection = direction;

  startWidth = windowRef.value.offsetWidth;
  startHeight = windowRef.value.offsetHeight;
  startResizeLeft = windowRef.value.offsetLeft;
  startResizeTop = windowRef.value.offsetTop;
  windowRef.value!.classList.add('untransition')
  startX = e.clientX;
  startY = e.clientY;

  document.addEventListener('mousemove', resizeWindow);
  document.addEventListener('mouseup', stopResize);
}

const resizeWindow = (e: MouseEvent) => {
  if (!isResizing || !windowRef.value || winMaxSize.value) return;

  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  let newWidth = startWidth;
  let newHeight = startHeight;
  let newLeft = startResizeLeft;
  let newTop = startResizeTop;

  switch (resizeDirection) {
    case 'nw':
      newWidth = startWidth - deltaX;
      newHeight = startHeight - deltaY;
      newLeft = startResizeLeft + deltaX;
      newTop = startResizeTop + deltaY;
      break;
    case 'ne':
      newWidth = startWidth + deltaX;
      newHeight = startHeight - deltaY;
      newTop = startResizeTop + deltaY;
      break;
    case 'sw':
      newWidth = startWidth - deltaX;
      newHeight = startHeight + deltaY;
      newLeft = startResizeLeft + deltaX;
      break;
    case 'se':
      newWidth = startWidth + deltaX;
      newHeight = startHeight + deltaY;
      break;
    case 'n':
      newHeight = startHeight - deltaY;
      newTop = startResizeTop + deltaY;
      break;
    case 's':
      newHeight = startHeight + deltaY;
      break;
    case 'w':
      newWidth = startWidth - deltaX;
      newLeft = startResizeLeft + deltaX;
      break;
    case 'e':
      newWidth = startWidth + deltaX;
      break;
  }

  const minWidth = 200;
  const minHeight = 150;

  if (newWidth < minWidth) {
    newWidth = minWidth;
    if (resizeDirection.includes('w')) {
      newLeft = startResizeLeft + startWidth - minWidth;
    }
  }

  if (newHeight < minHeight) {
    newHeight = minHeight;
    if (resizeDirection.includes('n')) {
      newTop = startResizeTop + startHeight - minHeight;
    }
  }

  windowRef.value.style.width = newWidth + 'px';
  windowRef.value.style.height = newHeight + 'px';
  windowRef.value.style.left = newLeft + 'px';
  windowRef.value.style.top = newTop + 'px';
}

const stopResize = () => {
  isResizing = false;
  resizeDirection = '';
  windowRef.value!.classList.remove('untransition')
  document.removeEventListener('mousemove', resizeWindow);
  document.removeEventListener('mouseup', stopResize);
}

onMounted(() => {
  if (!windowRef.value || !windowHeaderRef.value) return;

  nextTick(() => {
    if (windowRef.value) {
      windowSize.value = {
        width: windowRef.value.offsetWidth,
        height: windowRef.value.offsetHeight,
        left: windowRef.value.offsetLeft,
        top: windowRef.value.offsetTop
      };
    }
  });

  windowHeaderRef.value.addEventListener('mousedown', (e) => {
    if (winMaxSize.value || (e.target as HTMLElement).closest('.window-header-btn')) {
      return;
    }

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = windowRef.value!.offsetLeft;
    startTop = windowRef.value!.offsetTop;
    windowRef.value!.classList.add('untransition')
    e.preventDefault();
  });

  mouseMoveListener = (e: MouseEvent) => {
    if (!isDragging || !windowRef.value || winMaxSize.value) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const newLeft = startLeft + dx;
    const newTop = startTop + dy;

    windowRef.value!.style.left = newLeft + 'px';
    windowRef.value!.style.top = newTop + 'px';
  };

  mouseUpListener = () => {
    isDragging = false;
    if (windowHeaderRef.value) {
      windowRef.value!.classList.remove('untransition')
    }
  };

  document.addEventListener('mousemove', mouseMoveListener);
  document.addEventListener('mouseup', mouseUpListener);
})

onUnmounted(() => {
  cleanupEventListeners();
})
</script>

<style scoped>
.window {
  width: 50%;
  height: 50%;
  min-width: 200px;
  min-height: 150px;

  position: absolute;
  background-color: var(--color-background);
  z-index: 999999;
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;

  transition: all 0.2s ease-in-out;
  animation: show 0.3s ease-in-out;
}

.window.untransition {
  transition: none;
}

.window.maximized {
  border-radius: 0;
}

.window-header {
  width: 100%;
  height: 30px;
  background-color: var(--color-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}

.window-header.disabled {
  cursor: default;
}

.window-header-title {
  padding-left: 10px;
  color: white;
  font-size: var(--font-size-sm);
  flex-grow: 1;
}

.window-header-btn {
  width: 60px;
  height: 30px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s ease-in-out;
}

.window-header-btn a {
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.window-header-btn a:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.window-content {
  width: 100%;
  height: calc(100% - 30px);
  overflow: auto;
}

.resize-handle {
  position: absolute;
  z-index: 1000000;
}

.resize-nw {
  top: -5px;
  left: -5px;
  width: 10px;
  height: 10px;
  cursor: nw-resize;
}

.resize-ne {
  top: -5px;
  right: -5px;
  width: 10px;
  height: 10px;
  cursor: ne-resize;
}

.resize-sw {
  bottom: -5px;
  left: -5px;
  width: 10px;
  height: 10px;
  cursor: sw-resize;
}

.resize-se {
  bottom: -5px;
  right: -5px;
  width: 10px;
  height: 10px;
  cursor: se-resize;
}

.resize-n {
  top: -5px;
  left: 10px;
  right: 10px;
  height: 10px;
  cursor: n-resize;
}

.resize-s {
  bottom: -5px;
  left: 10px;
  right: 10px;
  height: 10px;
  cursor: s-resize;
}

.resize-w {
  left: -5px;
  top: 10px;
  bottom: 10px;
  width: 10px;
  cursor: w-resize;
}

.resize-e {
  right: -5px;
  top: 10px;
  bottom: 10px;
  width: 10px;
  cursor: e-resize;
}

@keyframes show {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
