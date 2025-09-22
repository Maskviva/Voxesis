<template>
  <div class="instances">
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
        <div
            class="instance-card"
            v-for="instance in instances"
            :key="instance.name"
            @click="selectInstance(instance)"
        >
          <div class="instance-header">
            <h3>{{ instance.name }}</h3>
            <span class="status" :class="instance.status">{{ getStatusText(instance.status) }}</span>
          </div>
          <div class="instance-details">
            <p><i class="icon-folder"></i> {{ instance.path }}</p>
          </div>
          <div class="instance-tags">
            <span v-if="instance.conPty">
              ConPty
            </span>
            <span v-if="instance.abs">
              绝对路径
            </span>
          </div>
          <div class="instance-actions">
            <button
                class="action-button start"
                :disabled="instance.status !== 'stopped'"
                @click.stop="startInstance(instance)"
            >
              启动
            </button>
            <button
                class="action-button stop"
                :disabled="instance.status !== 'running'"
                @click.stop="stopInstance(instance)"
            >
              停止
            </button>
            <button class="action-button del" @click.stop="removeInstance(instance)">
              删除
            </button>
          </div>
        </div>

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
        <div class="modal-body">
          <form @submit.prevent="createInstance">
            <div class="form-group">
              <label for="instanceName">实例名称</label>
              <input
                  type="text"
                  id="instanceName"
                  v-model="newInstance.name"
                  placeholder="例如: My Minecraft Server"
                  required
              />
            </div>

            <div class="form-group">
              <label for="instancePath">存储路径</label>
              <div class="path-input">
                <input
                    type="text"
                    id="instancePath"
                    v-model="newInstance.path"
                    placeholder="实例可执行文件路径"
                    required
                />
                <button v-if="!newInstance.abs" type="button" class="browse-button" @click="browsePath">
                  浏览
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="instanceArgs">启动参数</label>
              <div class="args-input">
                <div class="args-list">
                  <div
                      class="arg-item"
                      v-for="(_, index) in newInstance.args"
                      :key="index"
                  >
                    <input
                        type="text"
                        v-model="newInstance.args[index]"
                        placeholder="参数"
                    />
                    <button
                        type="button"
                        class="remove-arg"
                        @click="removeArg(index)"
                    >
                      &times;
                    </button>
                  </div>
                </div>
                <button
                    type="button"
                    class="add-arg-button"
                    @click="addArg"
                >
                  添加参数
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>
                <input
                    type="checkbox"
                    v-model="newInstance.conPty"
                />
                启用ConPTY
              </label>
            </div>

            <div class="form-group">
              <label>
                <input
                    type="checkbox"
                    v-model="newInstance.abs"
                />
                使用相对路径
              </label>
            </div>

            <div class="modal-actions">
              <button type="button" class="cancel-button" @click="showCreateModal = false">
                取消
              </button>
              <button type="submit" class="confirm-button">
                创建实例
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {mcServerConfigManager} from "../instance/mcServerInstanceManager";

// 实例状态类型
type InstanceStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'error' | ''

// 实例接口
interface Instance {
  name: string
  path: string
  abs: boolean
  conPty: boolean
  args: string[]
  status: InstanceStatus
}

const mManager = new mcServerConfigManager()

// 实例数据
const instances = ref<Instance[]>([])

const newInstance = ref<Instance>({
  name: "",
  path: "",
  abs: false,
  conPty: false,
  args: [],
  status: ""
})

const showCreateModal = ref(false)

const getStatusText = (status: InstanceStatus): string => {
  const statusMap: Record<InstanceStatus, string> = {
    running: '运行中',
    stopped: '已停止',
    starting: '启动中',
    stopping: '停止中',
    error: '错误',
    "": ""
  }
  return statusMap[status]
}

const selectInstance = (instance: Instance) => {
  console.log('Selected instance:', instance)
}

// 启动实例
const startInstance = (instance: Instance) => {

}

// 停止实例
const stopInstance = (instance: Instance) => {
}

// 删除实例
const removeInstance = (instance: Instance) => {
  mManager.DelServer(instance.name)
  instances.value = instances.value.filter(i => i !== instance)
}

// 浏览路径
const browsePath = () => {
  console.log('Browsing for path')
  // 这里可以调用文件选择对话框
}

// 添加参数
const addArg = () => {
  newInstance.value.args.push('')
}

// 删除参数
const removeArg = (index: number) => {
  newInstance.value.args.splice(index, 1)
}

// 创建实例
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
    status: ''
  }
  showCreateModal.value = false
}

onMounted(() => {
  mManager.create().then(() => {
    mManager.GetAllServerData().then((data) => {
      for (const key in data) {
        const item = JSON.parse(data[key])
        instances.value.push({
          name: item.name,
          path: item.path,
          abs: item.abs,
          conPty: item.conPty,
          args: item.args,
          status: 'stopped'
        })
      }
    })
  })
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

.instance-card {
  background-color: var(--color-background-elevated);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-default);
  transition: all var(--transition-fast);
  cursor: pointer;
  border: 1px solid var(--color-border);
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
}

.status {
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
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
  margin-bottom: 20px;
}

.instance-details p {
  margin: 8px 0;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
}

.instance-tags {
  display: flex;
  flex-wrap: wrap;
  margin: 10px;
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

.instance-actions {
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
  background-color: var(--color-error);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.action-button.del:hover {
  opacity: 0.8;
  transform: translateY(-2px);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
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

.modal-body {
  padding: 20px 24px;
}

.form-group {
  margin-bottom: 20px;
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

.path-input {
  display: flex;
  gap: 8px;
}

.path-input input {
  flex: 1;
}

.browse-button {
  padding: 10px 16px;
  background-color: var(--color-background-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.browse-button:hover {
  background-color: var(--color-background-tertiary);
}

.form-group input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-button,
.confirm-button {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cancel-button {
  background-color: var(--color-background-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.cancel-button:hover {
  background-color: var(--color-background-tertiary);
}

.confirm-button {
  background-color: var(--color-primary);
  color: white;
  border: none;
}

.confirm-button:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
}

.args-input {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  background-color: var(--color-background);
}

.args-list {
  margin-bottom: 12px;
}

.arg-item {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.arg-item:last-child {
  margin-bottom: 0;
}

.arg-item input {
  flex: 1;
  margin-bottom: 0;
}

.remove-arg {
  background-color: var(--color-error);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  width: 35px;
  height: 35px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.remove-arg:hover {
  opacity: 0.9;
}

.add-arg-button {
  padding: 6px 12px;
  background-color: var(--color-background-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.add-arg-button:hover {
  background-color: var(--color-background-tertiary);
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

  .instance-actions {
    flex-direction: column;
  }

  .path-input {
    flex-direction: column;
  }
}
</style>
