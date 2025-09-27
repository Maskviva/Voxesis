<template>
  <div class="instance-card" :key="instance.name" @click="showChildWindow">
    <div class="instance-header">
      <h3>{{ instance.name }}</h3>
      <span class="status" :class="instance.status">{{ getStatusText(instance.status) }}</span>
    </div>
    <div class="instance-details">
      <p><i class="icon-folder"></i> {{ instance.path }}</p>
    </div>
    <div class="instance-tags">
      <span v-if="instance.conPty">ConPty</span>
      <span v-if="!instance.abs">相对路径</span>
    </div>
    <div class="instance-actions">
      <button
          class="action-button start"
          :disabled="instance.status === 'running' || instance.status === 'starting'"
          @click.stop="startInstance"
      >
        启动
      </button>
      <button
          class="action-button stop"
          :disabled="instance.status === 'stopped'"
          @click.stop="stopInstance"
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
import {mcServerConfigManager, ServersState} from "../../instance/mcServerInstanceManager";
import {onMounted, onUnmounted, triggerRef} from "vue";
import {Instance} from "../../view/instance.vue";

const props = defineProps<{
  instance: Instance;
  modelValue: Instance[];
  mManager: mcServerConfigManager;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Instance[]): void;
  (e: 'onShowChild', instance: Instance): void;
  (e: 'opened'): void;
  (e: 'closed'): void;
}>();

let onlineListener: NodeJS.Timeout | number | null = null;
let serverOffline = false;

const startInstance = async () => {
  const server = await props.mManager.GetServer(props.instance.name);
  if (server) {
    server.Start();
    props.instance.status = 'running';
    serverOffline = true;
    emit('opened');
  }
};

const stopInstance = async () => {
  const server = await props.mManager.GetServer(props.instance.name);
  if (server) {
    server.Stop();
    props.instance.status = 'stopped';
    serverOffline = false;
    emit('closed');
  }
};

const removeInstance = () => {
  props.mManager.DelServer(props.instance.name);
  emit('update:modelValue', props.modelValue.filter(i => i.name !== props.instance.name));
};

const showChildWindow = () => {
  emit('onShowChild', props.instance);
};

const getStatusText = (status: Instance['status']): string => {
  const statusMap: Record<Instance['status'], string> = {
    running: '运行中',
    stopped: '已停止',
    starting: '启动中',
  };
  return statusMap[status] || "未知";
};

onMounted(async () => {
  const server = await props.mManager.GetServer(props.instance.name);
  if (!server) return;

  onlineListener = setInterval(async () => {
    if (!serverOffline) return;

    try {
      const [state, error] = await server.GetStatus();

      if (error || !state) {
        if (String(error).includes("服务器未在运行")) {
          serverOffline = false;
        }

        if (ServersState.value.has(props.instance.name)) {
          ServersState.value.delete(props.instance.name);
          triggerRef(ServersState);
        }
        return;
      }

      let currentState = ServersState.value.get(props.instance.name);

      if (currentState) {
        currentState.cpu.push({value: state.cpu, time: state.runTime});
        currentState.memory.push({value: state.memory, time: state.runTime});

        if (currentState.cpu.length > 100) {
          currentState.cpu.shift();
        }
        if (currentState.memory.length > 100) {
          currentState.memory.shift();
        }

        currentState.runTime = state.runTime;
      } else {
        ServersState.value.set(props.instance.name, {
          pid: state.pid,
          cpu: [{value: state.cpu, time: state.runTime}],
          memory: [{value: state.memory, time: state.runTime}],
          runTime: state.runTime
        });
      }

      triggerRef(ServersState);

    } catch (e) {
      console.error(`获取实例 [${props.instance.name}] 状态失败:`, e);
      if (ServersState.value.has(props.instance.name)) {
        ServersState.value.delete(props.instance.name);
        triggerRef(ServersState);
      }
    }
  }, 1000);
});

onUnmounted(() => {
  if (onlineListener) {
    clearInterval(onlineListener);
  }

  if (ServersState.value.has(props.instance.name)) {
    const newMap = new Map(ServersState.value);
    newMap.delete(props.instance.name);
    ServersState.value = newMap;
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
  margin-top: auto; /* 将按钮推到底部 */
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