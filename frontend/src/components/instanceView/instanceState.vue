<template>
  <ChildWindow :id="name" :title="name">
    <div class="dashboard">
      <div class="overview-panel">
        <StatusCard :status-list="statusList"/>
        <MonitorCard :series="monitorSeries"/>
        <Terminal class="terminal-wrapper" :instance="instance"/>
      </div>

      <div class="sidebar">
        <div>

        </div>
        <SystemInfoCard :system-info="systemInfo"/>
        <PlayerListCard :players-data="PlayersData"/>
      </div>
    </div>
  </ChildWindow>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import ChildWindow from "../ChildWindow.vue";
import StatusCard, {type StatusItem} from "./instanceStateComponents/StatusCard.vue";
import MonitorCard, {type Series} from "./instanceStateComponents/MonitorCard.vue";
import SystemInfoCard, {type SystemInfoItem} from "./instanceStateComponents/SystemInfoCard.vue";
import PlayerListCard, {type Player} from "./instanceStateComponents/PlayerListCard.vue";
import Terminal from "./instanceStateComponents/Terminal.vue";
import {InstanceState, useInstancesStore} from "../../stores/mcServerInstanceStore";

const props = defineProps<{
  name: string;
}>();

const instancesStore = useInstancesStore()
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
    {percentage: latestMemory / 4096 * 100, label: '内存', detail: `${latestMemory.toFixed(2)} MB`, color: '#84cc16'},
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

const PlayersData = ref<Player[]>([
  {label: '网站', value: 0},
  {label: '数据库-所有', value: 0},
  {label: '计划任务', value: 0},
  {label: '已安装应用', value: 0},
]);
</script>

<style scoped>
.dashboard {
  display: flex;
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
</style>