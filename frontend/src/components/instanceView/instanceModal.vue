<template>
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
          <button v-if="newInstance.abs" type="button" class="browse-button" @click="browsePath">
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
          <span>(ll必须开启 java 也推荐开启)</span>
        </label>
      </div>

      <div class="form-group">
        <label>
          <input
              type="checkbox"
              v-model="newInstance.abs"
          />
          使用绝对路径
        </label>
      </div>

      <div class="modal-actions">
        <button type="button" class="cancel-button" @click="closeModal()">
          取消
        </button>
        <button type="submit" class="confirm-button">
          创建实例
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import {UnwrapRef} from "vue";
import {type Instance} from "../../view/instance.vue";

const props = defineProps<{
  createInstance: () => void
  newInstance: UnwrapRef<Instance>
  closeModal: () => void
}>()

// 浏览路径
const browsePath = () => {
  console.log('Browsing for path')
  // 这里可以调用文件选择对话框
}

// 添加参数
const addArg = () => {
  props.newInstance.args.push('')
}

// 删除参数
const removeArg = (index: number) => {
  props.newInstance.args.splice(index, 1)
}

</script>

<style scoped>

.modal-body {
  padding: 20px 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group span {
  font-size: 12px;
  text-align: center;
  color: var(--color-text-secondary);
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