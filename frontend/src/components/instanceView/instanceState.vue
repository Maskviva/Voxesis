<template>
  <ChildWindow class="main-window" :id="name" :title="'实例-' + name">
    <div class="dashboard">
      <div class="overview-panel">
        <StatusCard :status-list="statusList"/>
        <MonitorCard :series="monitorSeries"/>
        <Terminal class="terminal-wrapper" :instance="instance"/>
      </div>

      <div class="sidebar">
        <div class="button-box">
          <button
              class="action-button start"
              :disabled="instance.processState.status === 'running' || instance.processState.status === 'starting'"
              @click.stop="instancesStore.startInstance(instance.instanceInfo.id)"
          >
            启动
          </button>
          <button
              class="action-button stop"
              :disabled="instance.processState.status === 'stopped'"
              @click.stop="instancesStore.stopInstance(instance.instanceInfo.id, playerListStore)"
          >
            停止
          </button>
          <button class="action-button del"
                  @click.stop="instancesStore.deleteInstance(instance.instanceInfo.id)">
            删除实例
          </button>
        </div>
        <SystemInfoCard :system-info="systemInfo"/>
        <PlayerListCard :id="instance.instanceInfo.id" :instance="instance"/>
      </div>
    </div>
  </ChildWindow>
</template>

<script setup lang="ts">
import {computed} from "vue";
import ChildWindow from "../ChildWindow.vue";
import StatusCard, {type StatusItem} from "./instanceStateComponents/StatusCard.vue";
import MonitorCard, {type Series} from "./instanceStateComponents/MonitorCard.vue";
import SystemInfoCard, {type SystemInfoItem} from "./instanceStateComponents/SystemInfoCard.vue";
import PlayerListCard from "./instanceStateComponents/PlayerListCard.vue";
import Terminal from "./instanceStateComponents/Terminal.vue";
import {InstanceState, useInstancesStore} from "../../stores/McServerInstanceStore";
import {usePlayerListStore} from "../../stores/PlayerListStore";
import {useSystemStateStore} from "../../stores/SystemStateStore";

const props = defineProps<{
  name: string;
}>();

const instancesStore = useInstancesStore()
const playerListStore = usePlayerListStore()
const systemStateStore = useSystemStateStore()
const instance = instancesStore.instances.find(s => s.instanceInfo.name === props.name) as InstanceState;

const systemInfo = computed<SystemInfoItem[]>(() => [
  {label: '实例名称', value: instance.instanceInfo.name},
  {label: '进程 PID', value: instance.processState.pid || 'N/A'},
  {label: '运行时间', value: instance.processState.runTime},
]);

const statusList = computed<StatusItem[]>(() => {
  const latestCpu = instance.processState.cpu.slice(-1)[0]?.value ?? 0;
  const latestMemory = instance.processState.memory.slice(-1)[0]?.value ?? 0;

  return [
    {percentage: latestCpu, label: 'CPU', detail: `${latestCpu.toFixed(2)} %`, color: '#3b82f6'},
    {
      percentage: latestMemory / systemStateStore.systemStates[0].OsMemory,
      label: '内存',
      detail:
          `${latestMemory.toFixed(2)} MB`,
      color:
          '#84cc16'
    },
  ];
});

const monitorSeries = computed<Series[]>(() => {
  const cpuData = instance.processState.cpu.map((value, _) => ({time: value.time, value: value.value}));
  const memData = instance.processState.memory.map((value, _) => ({time: value.time, value: value.value}));

  return [
    {
      label: 'CPU',
      status: `${cpuData.slice(-1)[0]?.value.toFixed(2) ?? 0} %`,
      color: '#3b82f6',
      data: cpuData
    },
    {
      label: '内存',
      status: `${memData.slice(-1)[0]?.value.toFixed(2) ?? 0} MB`,
      color: '#84cc16',
      data: memData
    }
  ];
});
</script>

<style scoped>
.main-window {
  container-type: inline-size;
  container-name: sidebar-container;
}

.dashboard {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color-background);
}

.overview-panel {
  flex: 3;
  padding: var(--spacing-lg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.terminal-wrapper {
  flex-grow: 1;
  min-height: 40vh;
  display: flex;
  flex-direction: column;
}

.sidebar {
  flex: 1;
  min-width: 280px;
  padding: var(--spacing-lg);
  background-color: var(--color-background-secondary);
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.overview-panel::-webkit-scrollbar,
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.overview-panel::-webkit-scrollbar-thumb,
.sidebar::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 3px;
}

.button-box {
  width: 100%;
  height: 32px;

  display: flex;
  align-items: center;
  gap: 10px;
}

.action-button {
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex: 1;
}

.action-button.start {
  background-color: var(--color-success);
  color: white;
}

.action-button.start:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
}

.action-button.stop {
  background-color: var(--color-error);
  color: white;
}

.action-button.stop:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
}

.action-button.del {
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.action-button.del:hover {
  background-color: var(--color-error);
  color: white;
  border-color: var(--color-error);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 992px) {
  .dashboard {
    flex-direction: column;
    height: auto;
  }

  .overview-panel, .sidebar {
    overflow-y: visible;
  }

  .sidebar {
    border-left: none;
    border-top: 1px solid var(--color-border);
  }
}

@container (max-width: 992px) {
  .dashboard {
    flex-direction: column;
    height: auto;
  }

  .overview-panel, .sidebar {
    overflow-y: visible;
  }

  .sidebar {
    border-left: none;
    border-top: 1px solid var(--color-border);
  }
}
</style>