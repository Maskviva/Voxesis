<template>
  <div class="instance-card" @click="showChildWindow">
    <div class="instance-header">
      <h3>{{ instance.instanceInfo.name }}</h3>
      <span class="status" :class="instance.processState.status">{{ getStatusText() }}</span>
    </div>
    <div class="instance-details">
      <p><i class="icon-folder"></i> {{ instance.instanceInfo.path }}</p>
    </div>
    <div class="instance-tags">
      <span v-if="instance.instanceInfo.conPty">ConPty</span>
      <span v-if="!instance.instanceInfo.abs">相对路径</span>
    </div>
    <div class="instance-actions">
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
      <button class="action-button del" @click.stop="removeInstance">
        删除实例
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {InstanceState, useInstancesStore} from "../../stores/server/McServerInstanceStore";
import {onMounted, onUnmounted} from "vue";
import {usePlayerListStore} from "../../stores/server/PlayerListStore";

const props = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  (e: 'onShowChild', name: string): void;
  (e: 'opened'): void;
  (e: 'closed'): void;
}>();

const instancesStore = useInstancesStore()
const playerListStore = usePlayerListStore()
const instance = instancesStore.instances.find(instance => instance.instanceInfo.name === props.name)

let onlineListener: NodeJS.Timeout | number | null = null;

const removeInstance = () => {
  instancesStore.deleteInstance(instance.instanceInfo.id)
};

const showChildWindow = () => {
  emit('onShowChild', instance.instanceInfo.name);
};

const getStatusText = (): string => {
  const statusMap: Record<InstanceState['processState']['status'], string> = {
    running: '运行中',
    stopped: '已停止',
    starting: '启动中',
    stopping: '停止中'
  };
  return statusMap[instance.processState.status] || "未知";
};

onMounted(() => {
  onlineListener = setInterval(() => {
    if (instance.processState.status != "running") return;
    instancesStore.updateInstanceStatus(instance.instanceInfo.id)
  }, 1000);
});

onUnmounted(() => {
  if (onlineListener) {
    clearInterval(onlineListener);
  }
});
</script>

<style scoped>
.instance-card {
  background-color: var(--color-background-elevated);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-default);
  transition: all var(--transition-fast);
  cursor: pointer;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.instance-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.instance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.instance-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text);
  word-break: break-all;
}

.status {
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
  margin-left: 8px;
}

.status.running {
  background-color: var(--color-success);
  color: white;
}

.status.stopped {
  background-color: var(--color-text-tertiary);
  color: white;
}

.status.starting,
.status.stopping {
  background-color: var(--color-warning);
  color: white;
}

.status.error {
  background-color: var(--color-error);
  color: white;
}

.instance-details {
  margin-bottom: 16px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  word-break: break-all;
}

.instance-details p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.instance-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.instance-tags span {
  padding: 4px 8px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  background-color: var(--color-background-tertiary);
  color: var(--color-text-tertiary);
}

.instance-actions {
  margin-top: auto;
  display: flex;
  gap: 8px;
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
</style>