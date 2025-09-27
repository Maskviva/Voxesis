<template>
  <div ref="instancesRef" class="instances">
    <div class="section fade-in-down">
      <div class="header">
        <h2>实例管理</h2>
        <button class="create-button" @click="showCreateModal = true">
          <i class="icon-plus"></i>
          创建实例
        </button>
      </div>
      <p class="subtitle">管理您的 Minecraft 服务器实例</p>
    </div>

    <div class="section-content fade-in-up delay-1">
      <div class="instances-grid">
        <instanceItem
            :instance="instance"
            v-for="instance in instances"
            :key="instance.name"
            v-model="instances"
            :mManager="mManager"
            @onShowChild="showDataWindow"
            @opened="runningServers.push({name: instance.name})"
            @closed="removeFromRunningServers(instance.name)"
        />

        <div v-if="instances.length === 0" class="empty-state">
          <i class="icon-server icon-large"></i>
          <h3>暂无实例</h3>
          <p>创建您的第一个 Minecraft 服务器实例</p>
          <button class="create-button large" @click="showCreateModal = true">
            创建实例
          </button>
        </div>
      </div>
    </div>

    <div class="modal" v-if="showCreateModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>创建新实例</h3>
          <button class="close-button" @click="showCreateModal = false">&times;</button>
        </div>
        <instanceModal :createInstance="createInstance" :newInstance="newInstance"
                       :closeModal="() => {showCreateModal = false}"/>
      </div>
    </div>

    <component
        v-for="item in childWindowData"
        :key="item.id"
        :is="instanceState"
        :id="item.id"
        :title="item.data.name"
        :data="item.data"
        :mManager="mManager"
        @closed="dataWindowClosed"
    />
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {mcServerConfigManager} from "../instance/mcServerInstanceManager";
import InstanceItem from "../components/instanceView/instanceItem.vue";
import InstanceModal from "../components/instanceView/instanceModal.vue";
import {ElMessage} from "element-plus";
import instanceState from "../components/instanceView/instanceState.vue";

type InstanceStatus = 'running' | 'stopped' | 'starting'

export type Instance = {
  name: string
  path: string
  abs: boolean
  conPty: boolean
  args: string[]
  status: InstanceStatus
}

type ChildWindowData = {
  id: string;
  data: Instance;
}

const instancesRef = ref<HTMLDivElement>()
const mManager = new mcServerConfigManager()
const runningServers = ref<{ name: string }[]>([])
const instances = ref<Instance[]>([])

const childWindowData = ref<ChildWindowData[]>([])

const newInstance = ref<Instance>({
  name: "",
  path: "",
  abs: true,
  conPty: false,
  args: [],
  status: "stopped"
})

const showCreateModal = ref(false)

const showDataWindow = (instance: Instance) => {
  if (childWindowData.value.some(item => item.id === instance.name)) {
    ElMessage({
      message: "当前实例窗口已打开",
      type: "warning",
    });
    return;
  }

  childWindowData.value.push({
    id: instance.name,
    data: instance,
  });
}

const dataWindowClosed = (id: string) => {
  childWindowData.value = childWindowData.value.filter(item => item.id !== id)
}

const createInstance = () => {
  mManager.NewServer(newInstance.value.name, newInstance.value.path, newInstance.value.abs, newInstance.value.conPty, newInstance.value.args)

  instances.value.push({
    name: newInstance.value.name,
    path: newInstance.value.path,
    abs: newInstance.value.abs,
    conPty: newInstance.value.conPty,
    args: newInstance.value.args,
    status: 'stopped'
  })

  newInstance.value = {
    name: "",
    path: "",
    abs: false,
    conPty: false,
    args: [],
    status: 'stopped'
  }
  showCreateModal.value = false
}

const removeFromRunningServers = (name: string) => {
  const index = runningServers.value.findIndex(server => server.name === name);
  if (index > -1) {
    runningServers.value.splice(index, 1);
  }
}

const loadInstances = async () => {
  await mManager.create();
  const data = await mManager.GetAllServerData();
  instances.value = Object.values(data).map(itemStr => {
    const item = JSON.parse(itemStr as string);
    return {
      name: item.name,
      path: item.path,
      abs: item.abs,
      conPty: item.conPty,
      args: item.args,
      status: 'stopped'
    };
  });
};

onMounted(() => {
  loadInstances();
})
</script>

<style scoped>
.instances {
  width: 100%;
  height: 100%;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.header h2 {
  margin: 0;
  font-size: var(--font-size-xxl);
  color: var(--color-text);
}

.subtitle {
  margin: 0 0 24px 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.create-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.create-button:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
}

.create-button.large {
  padding: 12px 24px;
  font-size: var(--font-size-base);
}

.instances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.instance-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text);
}

.instance-details p {
  margin: 8px 0;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
}

.instance-tags span {
  padding: 4px 8px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  background-color: var(--color-background-tertiary);
  color: var(--color-text-tertiary);
  margin-right: 8px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px 24px;
  background-color: var(--color-background-elevated);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);
}

.empty-state .icon-large {
  font-size: 48px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
  display: block;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: var(--color-text);
  font-size: var(--font-size-xl);
}

.empty-state p {
  margin: 0 0 24px 0;
  color: var(--color-text-secondary);
}

.modal {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--color-background-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-background-elevated);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-xl);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: var(--color-text);
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size-base);
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}

.form-group input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.arg-item input {
  flex: 1;
  margin-bottom: 0;
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

@media (max-width: 768px) {
  .instances {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .instances-grid {
    grid-template-columns: 1fr;
  }
}
</style>
