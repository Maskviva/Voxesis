<template>
  <div class="plugin-manager-container">
    <div class="plugin-manager-sidebar">
      <div class="sidebar-header fade-in-down delay-1">
        <h2>已安装插件</h2>
      </div>
      <ul class="plugin-list fade-in-down">
        <li
            class="plugin-item"
            :class="{ 'active': selectedPlugin?.name == 'global_settings' }"
            @click="selectedPlugin = {name: 'global_settings'} as PluginManifest">
          全局设置
        </li>

        <li v-for="plugin in pluginList
        " :key="plugin.name"
            class="plugin-item"
            :class="{ 'active': selectedPlugin?.name === plugin.name }"
            @click="selectedPlugin = plugin as PluginManifest">
          {{ plugin.name }}
        </li>

        <li v-if="pluginList.length == 0" class="empty-state">
          <IconArchive2Line size="48" class="empty-icon"/>
          <p>当前没有已加载的插件。</p>
        </li>
      </ul>
    </div>

    <div class="plugin-manager-content">
      <div class="plugin-details" v-if="selectedPlugin.name == 'global_settings'">
        <h1 class="plugin-name fade-in-down">全局设置</h1>
        <p class="plugin-intro fade-in-down delay-1">对原生Voxesis进行设置。</p>
      </div>
      <div v-else-if="selectedPlugin && selectedPlugin.name" :key="selectedPlugin.name" class="plugin-details">
        <div class="plugin-details-header">
          <div class="plugin-details-title">
            <a class="plugin-name fade-in-down " @click="appView.toggleView(selectedPlugin.name)">{{ selectedPlugin.name }}</a>
            <p class="plugin-intro  fade-in-down delay-1">{{ selectedPlugin.introduce }}</p>
          </div>
          <div class="plugin-details-actions fade-in-down delay-2">
            <button :disabled="viewStore.views.get(selectedPlugin.name).enable"
                    @click="viewStore.views.get(selectedPlugin.name).enable = true">启用
            </button>
            <button :disabled="!viewStore.views.get(selectedPlugin.name).enable"
                    @click="viewStore.views.get(selectedPlugin.name).enable = false">禁用
            </button>
          </div>
        </div>
        <PluginSettingComp
            class="fade-in-up"
            :key="selectedPlugin.name"
            :settings="selectedPlugin.settings"
        />
      </div>
      <div v-else class="empty-state">
        <IconArchive2Line size="48" class="empty-icon"/>
        <p>从左侧选择一个插件以查看其详细信息。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, inject, onMounted, ref} from 'vue';
import {type PluginSetting, PluginSettingItem, usePluginListStore} from "../stores/plugin/PluginStore";
import {IconArchive2Line} from "birdpaper-icon";
import PluginSettingComp from '../components/settingView/PluginSetting.vue';
import {useViewStore} from "../stores/core/ViewStore";

interface PluginManifest {
  main: string;
  name: string;
  component: any;
  introduce: string;
  line_icon: string;
  fill_icon: string;
  settings: PluginSetting;
}

const appView = inject<{ toggleView: (name: string) => void }>('AppViewMethod');
const viewStore = useViewStore();

const pluginListStore = usePluginListStore();
const pluginList = computed(() => Array.from(pluginListStore.pluginList.values()));

const selectedPlugin = ref<PluginManifest>({
  main: '',
  component: null,
  name: '',
  introduce: '',
  line_icon: '',
  fill_icon: '',
  settings: {
    plate: '',
    display: '',
    items: [] as PluginSettingItem[],
  }
});

onMounted(() => {
  if (pluginList.value.length > 0) {
    selectedPlugin.value = pluginList.value[0];
  }
});
</script>

<style scoped>
.plugin-manager-container {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 220px 1fr;
  background-color: var(--color-background);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.plugin-manager-sidebar {
  width: 100%;
  height: 100%;
  background-color: var(--color-background-secondary);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background-elevated);
}

.sidebar-header h2 {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.plugin-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plugin-item {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  border-left: 2px solid transparent;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  min-height: 32px;
}

.plugin-item:hover {
  background-color: var(--color-background-tertiary);
  color: var(--color-text);
}

.plugin-item.active {
  background-color: var(--color-primary-disabled);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
}

.plugin-manager-content {
  padding: var(--spacing-md);
  overflow-y: auto;
  background-color: var(--color-background);
}

.plugin-details {
  animation: fadeInUp var(--transition-normal) ease-out forwards;
}

.plugin-details-header {
  width: 100%;
  height: 100%;
  margin-bottom: var(--spacing-md);
  padding: 0;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  border-bottom: 1px solid var(--color-border-secondary);
}

.plugin-name {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  padding-right: var(--spacing-sm);
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  line-height: 1.2;
  cursor: pointer;
}

.plugin-name:hover {
  text-decoration: underline;
}

.plugin-intro {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
  padding-bottom: var(--spacing-md);
}

.plugin-details-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.plugin-details-actions button {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.plugin-details-actions button:hover:not(:disabled) {
  background-color: var(--color-background-secondary);
  border-color: var(--color-border-secondary);
}

.plugin-details-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.plugin-details-actions button:first-child:not(:disabled) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.plugin-details-actions button:first-child:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-tertiary);
  text-align: center;
  padding: var(--spacing-md);
}

.empty-icon {
  margin-bottom: var(--spacing-md);
  color: var(--color-border);
  opacity: 0.5;
}

.empty-state p {
  font-size: var(--font-size-sm);
  margin: 0;
  max-width: 260px;
  line-height: 1.4;
}

.fade-in-down {
  animation: fadeInDown 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(-20px);
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

.delay-1 {
  animation-delay: 0.2s;
}

.delay-2 {
  animation-delay: 0.3s;
}

@keyframes fadeInDown {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 64rem) {
  .plugin-manager-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .plugin-manager-sidebar {
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    max-height: 160px;
    overflow-x: auto;
  }

  .plugin-list {
    display: flex;
    overflow-x: auto;
    padding: var(--spacing-xs);
  }

  .plugin-item {
    white-space: nowrap;
    border-left: none;
    border-bottom: 2px solid transparent;
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .plugin-item.active {
    border-left-color: transparent;
    border-bottom-color: var(--color-primary);
  }
}

@media (max-width: 48rem) {
  .plugin-manager-content {
    padding: var(--spacing-sm);
  }

  .plugin-name {
    font-size: var(--font-size-lg);
  }
}
</style>