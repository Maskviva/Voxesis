<template>
  <header v-if="isWails" class="header" @dblclick="winToggleMaximise()">
    <a v-top-text v-hover v-ripple class="header-btn" style="padding: 8px;">
   <span style="display: flex; gap: 5px">
   <img style="margin: 0" src="./assets/images/logo_no_background.png" width="25" height="25"
        alt="logo">Voxesis</span>
    </a>

    <div class="header-control">
      <a v-top-text v-hover class="header-btn" @click="winMinimize()">
        <BirdpaperIcon.IconSubtractLine/>
      </a>
      <a v-top-text v-hover class="header-btn" @click="winToggleMaximise()">
        <component
            :is="!WinMaxSize ? BirdpaperIcon.IconCheckboxBlankLine : BirdpaperIcon.IconCheckboxMultipleBlankLine"/>
      </a>
      <a v-top-text v-hover class="header-btn" @click="closeWin()">
        <BirdpaperIcon.IconCloseLargeLine/>
      </a>
    </div>
  </header>

  <ul ref="view_list_box" class="sidebar">
    <Suspense>
      <li v-for="item in VIEW_LIST" @click="toggleView(item.name)">
        <IconToggle :LineIcon="item.line_icon" :FillIcon="item.fill_icon" :Size="25"
                    :Toggle="view_component.name == item.name"></IconToggle>
        <span class="sidebar-text">{{ item.introduce }}</span>
      </li>
    </Suspense>
  </ul>

  <div class="view-box">
    <transition name="fade">
      <keep-alive include="dashboard, proxy">
        <component :is="view_component.component"/>
      </keep-alive>
    </transition>
  </div>
</template>

<script setup lang="ts">
import {markRaw, onMounted, provide, Ref, ref, shallowRef, watch} from 'vue';
import * as BirdpaperIcon from 'birdpaper-icon'
import IconToggle from "./components/IconToggle.vue";
import HomeView from "./view/home.vue"
import InstanceView from "./view/instance.vue"
import {vTopText} from "./utils/topText";
import {vHover} from "./utils/hover";
import {vRipple} from "./utils/waves";
import {isWails} from "./stores/env";
import {closeWin, WinMaxSize, winMinimize, winToggleMaximise} from "./utils/window";
import ChildWindow from "./components/ChildWindow.vue";

const VIEW_LIST: Ref<{
  name: string,
  component: any,
  introduce: string,
  line_icon: any,
  fill_icon: any,
}[]> = ref([
  {
    name: 'instance',
    component: markRaw(InstanceView),
    introduce: "实例",
    line_icon: markRaw(BirdpaperIcon.IconDatabaseLine),
    fill_icon: markRaw(BirdpaperIcon.IconDatabaseFill),
  }
]);

const view_component = shallowRef({
  name: "",
  component: HomeView
});
const sidebar_before_top = ref("-50vh");
const view_list_box = ref();

const toggleView = (view: typeof VIEW_LIST.value[number]['name']) => {
  const targetView = VIEW_LIST.value.find(item => item.name === view);
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const index = VIEW_LIST.value.indexOf(targetView!);
  const itemHeight = 35 + (0.5 * rootFontSize);
  const totalOffset = index * itemHeight + rootFontSize;

  sidebar_before_top.value = totalOffset + "px";

  if (targetView) {
    view_component.value = {
      name: view,
      component: targetView.component
    };
  }
}

const ResponsiveHeight = ref("calc(100% - 50px)")

watch(isWails, () => {
  ResponsiveHeight.value = !isWails ? "calc(100% - 50px)" : "100vh"
})

onMounted(() => {
  const viewListBoxWheel = (event: WheelEvent) => {
    const ScrollDirection = event.deltaY > 0;
    const ViewIndex = VIEW_LIST.value.findIndex(component => component.name === view_component.value.name);

    if (ScrollDirection) {
      if (ViewIndex < VIEW_LIST.value.length - 1) {
        toggleView(VIEW_LIST.value[ViewIndex + 1].name)
      }
    } else {
      if (ViewIndex > 0) {
        toggleView(VIEW_LIST.value[ViewIndex - 1].name)
      }
    }
  }

  view_list_box.value.addEventListener('wheel', (e: WheelEvent) => viewListBoxWheel(e))
  view_list_box.value.removeEventListener('wheel', (e: WheelEvent) => viewListBoxWheel(e))
});

provide('AppViewMethod', {
  toggleView,
})
</script>

<style scoped>
.header {
  width: 100%;
  height: 50px;
  padding: var(--spacing-xs);
  background-color: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-default);

  --wails-draggable: drag;

  display: flex;
  align-items: center;

  z-index: 99999;

  transition: all var(--transition-normal);
  backdrop-filter: var(--header-backdrop-filter, blur(12px));
}

.header-control {
  margin-left: auto;
  padding: 0;
  --wails-draggable: no-drag;
  display: flex;
  flex-direction: row;
}

.header-btn {
  color: var(--color-text);
  text-decoration: none;
  padding: var(--spacing-xs) var(--spacing-md);
  margin: var(--spacing-xs);
  border-radius: var(--radius-md);
  cursor: pointer;
  --wails-draggable: no-drag;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;

  transition: all var(--transition-fast);
}

.header-btn:hover {
  background-color: var(--color-background-tertiary);
}

.sidebar {
  width: 40px;
  height: v-bind(ResponsiveHeight);

  padding-top: var(--spacing-md);
  list-style: none;
  background-color: var(--color-background-secondary);
  border-right: 1px solid var(--color-border);
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);

  display: flex;
  gap: var(--spacing-xs);
  flex-direction: column;
  align-items: center;

  position: relative;

  z-index: 99999;

  transition: all var(--transition-normal);
  backdrop-filter: var(--backdrop-filter, blur(10px));
}

.sidebar::before {
  content: "";
  width: 35px;
  height: 35px;

  background-color: var(--color-primary);
  border-radius: var(--radius-md);

  position: absolute;
  top: v-bind(sidebar_before_top);

  transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
}

.sidebar:deep(svg) {
  fill: var(--color-text);
  transition: all var(--transition-fast);
}

.sidebar > li {
  width: 35px;
  height: 35px;

  border-radius: var(--radius-md);

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;

  transition: all var(--transition-fast);
  z-index: 2;
}

.sidebar > li:hover {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-disabled));
  transform: scale(1.15);
  box-shadow: var(--shadow-hover);
  border-radius: var(--radius-lg);
}

.sidebar-text {
  width: auto;
  min-width: 50px;
  height: 20px;

  margin: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  box-sizing: border-box;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background-color: var(--color-background-secondary);

  position: absolute;
  left: 40px;

  display: flex;
  justify-content: flex-start;
  align-items: center;
  white-space: nowrap;

  opacity: 0;
  transform: translateX(-55px);

  transition: opacity 0.25s ease, transform var(--transition-normal);
}

.sidebar > li:hover .sidebar-text {
  opacity: 1;
  transform: translateX(0);
}

.view-box {
  width: calc(100% - 40px);
  height: v-bind(ResponsiveHeight);

  overflow: hidden;

  position: absolute;
  right: 0;
  bottom: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: all var(--transition-slow) cubic-bezier(0.34, 1.56, 0.64, 1);
  position: absolute;
  width: 100%;
  top: 0;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
