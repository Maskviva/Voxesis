<template>
  <header v-if="envIsWails" class="header" @dblclick="winToggleMaximise()">
    <a v-top-text v-hover v-ripple class="header-btn" style="padding: 8px;"
       @click="view_component = null; sidebar_before_top = '-50vh'">
      <span style="display: flex; gap: 5px">
        <img style="margin: 0" src="./assets/images/logo_no_background.png" width="25" height="25"
             alt="logo">Voxesis
      </span>
    </a>

    <div class="header-control">
      <a v-top-text v-hover class="header-btn" @click="winMinimize()">
        <IconSubtractLine/>
      </a>
      <a v-top-text v-hover class="header-btn" @click="winToggleMaximise()">
        <component
            :is="!WinMaxSize ? IconCheckboxBlankLine : IconCheckboxMultipleBlankLine"/>
      </a>
      <a v-top-text v-hover class="header-btn" @click="closeWin()">
        <IconCloseLargeLine/>
      </a>
    </div>
  </header>

  <ul ref="viewListBox" class="sidebar">
    <template v-for="item in viewStore.views.values()" :key="item.name">
      <li v-if="item.enable" class="item" @click="toggleView(item.name)">
        <IconToggle :LineIcon="item.Object.line_icon" :FillIcon="item.Object.fill_icon" :Size="25"
                    :Toggle="view_component?.name == item.name"></IconToggle>
        <span class="sidebar-text">{{ item.Object.introduce }}</span>
      </li>
    </template>

    <li ref="systemStateRef" class="system-state" :class="{ 'is-open': detailVisible }"
        @click="detailVisible = !detailVisible">
      <div class="summary">
        <span><IconCpuLine size="14"/> {{ systemState ? systemState.CpuUsage.toFixed(0) : "-" }}%</span>
        <span><IconRamLine size="14"/> {{ systemState ? systemState.MemoryUsage.toFixed(0) : "-" }}%</span>
      </div>
      <div class="detail">
        <div class="detail-item">
          <span style="font-size: 0.8rem">CPU</span>
          <ProgressBar height="10px" :progress="systemState?.CpuUsage || 0"/>
          <span>{{ systemState?.CpuUsage !== undefined ? systemState.CpuUsage.toFixed(1) + "%" : "N/A" }}</span>
        </div>
        <div class="detail-item">
          <span style="font-size: 0.8rem">Memory</span>
          <ProgressBar height="10px" :progress="systemState?.MemoryUsage || 0"/>
          <span>{{ systemState?.MemoryUsage !== undefined ? systemState.MemoryUsage.toFixed(1) + "%" : "N/A" }}</span>
        </div>
      </div>
    </li>
  </ul>

  <div class="view-box">
    <transition name="fade" mode="out-in">
      <HomeView v-if="!view_component"></HomeView>
      <keep-alive include="instance" v-else>
        <component :is="view_component.Object.component"/>
      </keep-alive>
    </transition>
  </div>
</template>

<script setup lang="ts">
import {type Component, computed, onMounted, provide, ref, shallowRef} from 'vue';
import {onClickOutside} from '@vueuse/core';

import {
  IconCheckboxBlankLine,
  IconCheckboxMultipleBlankLine,
  IconCloseLargeLine,
  IconCpuLine,
  IconRamLine,
  IconSubtractLine
} from 'birdpaper-icon'

import IconToggle from "./components/IconToggle.vue";
import HomeView from "./view/Home.vue";
import ProgressBar from "./components/ProgressBar.vue";

import {vTopText} from "./utils/topText";
import {vHover} from "./utils/hover";
import {vRipple} from "./utils/waves";
import {closeWin, WinMaxSize, winMinimize, winToggleMaximise} from "./utils/window";
import {useSystemStateStore} from "./stores/core/SystemStateStore";
import {SystemState} from "../bindings/voxesis/src/Common/Entity";
import {useAppConfigStore} from "./stores/core/AppConfigStore";
import {ThemePluginItem, usePluginListStore, ViewPluginItem} from "./stores/plugin/PluginStore";
import {useViewStore} from "./stores/core/ViewStore";
import {envIsWails} from "./api/common";
import {useThemeStore} from "./stores/core/ThemeStore";

const view_component = shallowRef<ViewPluginItem | null>(null);
const sidebar_before_top = ref("-50vh");
const viewListBox = ref<HTMLElement | null>(null);

const ResponsiveHeight = computed(() => !envIsWails ? "100vh" : "calc(100% - 50px)");

const viewStore = useViewStore();
const themeStore = useThemeStore();
const systemStateStore = useSystemStateStore();
const appConfigStore = useAppConfigStore()
const pluginListStore = usePluginListStore()
const systemState = computed<SystemState | undefined>(() => systemStateStore.systemStates[systemStateStore.systemStates.length - 1]);

const detailVisible = ref(false);
const systemStateRef = ref(null);
onClickOutside(systemStateRef, () => (detailVisible.value = false));

const toggleView = (viewName: string) => {
  const targetView = viewStore.views.get(viewName);
  if (!targetView) return;

  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const index = [...viewStore.views.values()].indexOf(targetView);
  const itemHeight = 35 + rootFontSize * 0.75;
  const totalOffset = index * itemHeight + rootFontSize - 1;

  sidebar_before_top.value = totalOffset + "px";

  view_component.value = targetView;
};

onMounted(async () => {
  await viewStore.Load();
  await pluginListStore.Load();
  await appConfigStore.Load();
  await themeStore.Load(appConfigStore);
  await systemStateStore.ListenState();

  // 加载视图插件到 useViewStore
  [...pluginListStore.viewPluginList.values()].forEach(plugin => {
    viewStore.AddView(plugin);
  });

  // 加载主题插件到 useThemeStore
  [...pluginListStore.themePluginList.values()].forEach((plugin: ThemePluginItem) => {
    let variableCache: { [key: string]: string }[] = []

    plugin.Object.themes.forEach(theme => {
      variableCache = []
      plugin.Object.variables.forEach(variable => {
        if (variable.theme != theme) return;
        variableCache.push(variable.value);
      })

      if (variableCache.length == 0) return;

      themeStore.AddTheme({
        name: theme,
        type: 'custom',
        variables: variableCache,
      });
    })
  });
});

provide('AppViewMethod', {
  toggleView,
});
</script>

<style scoped>
.header {
  width: 100%;
  height: 50px;
  padding: 0 var(--spacing-sm);
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
  transition: all var(--transition-fast) ease;
}

.header-btn:hover {
  background-color: var(--color-background-tertiary);
  transform: scale(1.05);
}

.header-btn:last-child:hover {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.sidebar {
  width: 40px;
  height: v-bind(ResponsiveHeight);
  padding-top: var(--spacing-md);
  padding-bottom: 70px;
  list-style: none;
  background-color: var(--color-background-secondary);
  border-right: 1px solid var(--color-border);
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: var(--spacing-sm);
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 99999;
  transition: all var(--transition-normal);
  backdrop-filter: var(--backdrop-filter, blur(10px));
}

.sidebar::before {
  content: "";
  width: 38px;
  height: 38px;
  background-color: var(--color-primary);
  border-radius: var(--radius-lg);
  position: absolute;
  top: v-bind(sidebar_before_top);
  transition: top 300ms ease-in-out;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.4);
}

.sidebar:deep(svg) {
  fill: var(--color-text);
  transition: all var(--transition-fast);
}

.sidebar .item {
  width: 35px;
  height: 35px;
  border-radius: var(--radius-lg);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  z-index: 2;
}

.sidebar .item:hover {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-disabled));
  transform: scale(1.1);
  box-shadow: none;
}

.sidebar-text {
  width: auto;
  min-width: 50px;
  height: 25px;
  padding: var(--spacing-xs) var(--spacing-sm);
  box-sizing: border-box;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background-color: var(--color-background-secondary);
  box-shadow: var(--shadow-default);
  position: absolute;
  left: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, left 0.3s ease;
  z-index: 100;
}

.sidebar .item:hover .sidebar-text {
  opacity: 1;
  left: 40px;
}

.view-box {
  width: calc(100% - 40px);
  height: v-bind(ResponsiveHeight);
  overflow: hidden;
  position: absolute;
  right: 0;
  bottom: 0;
}

.system-state {
  width: 90%;
  height: 40px;
  font-size: 0.6rem;
  padding: var(--spacing-xs) 0;
  margin-top: auto;
  border-radius: var(--radius-md);
  cursor: pointer;
  position: absolute;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  border: 1px solid transparent;
}

.system-state .summary {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  color: var(--color-text);
}

.system-state .summary span {
  display: flex;
  align-items: center;
  gap: 0.5px;
}

.system-state:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border);
}

.system-state .detail {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 180px;
  padding: var(--spacing-sm);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  position: absolute;
  bottom: -5px;
  left: calc(100% + 10px);
  opacity: 0;
  transform: translateX(10px) scale(0.95);
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;
  transform-origin: bottom left;
}

.system-state.is-open .detail {
  opacity: 1;
  transform: translateX(0) scale(1);
  pointer-events: auto;
}

.system-state .detail-item {
  display: grid;
  grid-template-columns: 50px 1fr 40px;
  align-items: center;
  gap: var(--spacing-xs);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
  top: 0;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>