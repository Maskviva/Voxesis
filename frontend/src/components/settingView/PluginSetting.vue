<template>
  <div class="settings-section">
    <div
        class="setting-items-wrapper"
        :class="{ 'grid-layout': settings.display }"
    >
      <div v-for="item in settings.items" :key="settings.items.indexOf(item)" class="setting-item">
        <label class="setting-label">{{ item.label }}</label>
        <div class="setting-control">

          <DropDown v-if="item.type == 'drop_down'" v-model:value="item.value as string | undefined" :list="item.list"
                    :placeholder="item.placeholder"/>

          <CustomSwitch v-if="item.type == 'switch'" v-model="item.value as boolean"/>

          <CustomInput v-if="item.type == 'input'"
                       v-model="item.value as string | number"
                       :max="item.value_type === 'number' ? item.max : undefined"
                       :min="item.value_type === 'number' ? item.min : undefined"
                       :placeholder="item.placeholder"
                       :type="item.value_type as 'number' | 'text' | 'password'"
          />

          <div v-if="item.type == 'select_dir' || item.type == 'select_file'" class="directory-control">
            <input
                v-model="item.value"
                :placeholder="item.placeholder"
                class="directory-input"
                readonly
                type="text"
            />
            <button class="browse-btn" @click="handleBrowse(item)">
              <IconFileUploadLine/>
              <span>选择</span>
            </button>
            <button class="browse-btn"
                    v-if="item.type === 'select_file'"
                    @click="openDirectory(getDirectoryPath(item.value as string))">
              <IconFolderOpenLine/>
              <span>打开</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {IconFileUploadLine, IconFolderOpenLine} from "birdpaper-icon";
import CustomSwitch from "../custom/CustomSwitch.vue";
import CustomInput from "../custom/CustomInput.vue";
import DropDown from "../custom/DropDown.vue";
import {ElMessage} from "element-plus";
import {Browser} from "@wailsio/runtime";
import {computed, onMounted, ref, watch} from "vue";
import {
  AuthDirectory,
  OpenDirectoryDialog,
  OpenFileDialog
} from "../../../bindings/voxesis/src/Communication/InterProcess/systemdialogipc";
import {useAppConfigStore} from "../../stores/core/AppConfigStore";
import {envIsWails} from "../../api/common";
import {PluginSetting, PluginSettingItem} from "../../stores/plugin/ViewPlugin";

const props = defineProps<{
  settings: PluginSetting;
}>();

const appConfigStore = useAppConfigStore();
const isInitialized = ref<boolean>(false);

onMounted(async () => {
  try {
    const conf = await appConfigStore.appConfig.GetAllValue();
    for (const item of props.settings.items) {
      if (conf[item.key] !== undefined) {
        item.value = conf[item.key];
      }
    }
  } catch (error) {
    console.error("Failed to fetch initial settings:", error);
    ElMessage.error("加载设置失败");
  } finally {
    setTimeout(() => {
      isInitialized.value = true;
    }, 0)
  }
});

const settingsState = computed(() => JSON.stringify(props.settings.items));

watch(settingsState, async (newStateStr, oldStateStr) => {
  if (!isInitialized.value || !oldStateStr) {
    return;
  }

  const newItems = JSON.parse(newStateStr) as PluginSettingItem[];
  const oldItems = JSON.parse(oldStateStr) as PluginSettingItem[];

  const changedItem = newItems.find((newItem, index) => {
    return oldItems[index] && newItem.value !== oldItems[index].value;
  });

  if (!changedItem || ['select_dir', 'select_file'].includes(changedItem.type)) {
    return;
  }

  try {
    await appConfigStore.appConfig.SetValueOfKey(changedItem.key, changedItem.value);
    ElMessage.success('设置已保存');
  } catch (error) {
    console.error(`Failed to save setting ${changedItem.key}:`, error);
    ElMessage.error('设置保存失败');
  }
});

function getDirectoryPath(fullPath: string): string {
  if (!fullPath) return '';
  const normalizedPath = fullPath.replace(/\\/g, '/');
  return normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
}

async function openDirectory(path: string) {
  if (!envIsWails) {
    return ElMessage({
      type: "warning",
      message: "此功能浏览器环境不适用"
    })
  }

  if (path == "" || !path) {
    ElMessage.warning('未设置目录');
    return;
  }

  try {
    await Browser.OpenURL(`file://${path}`);
  } catch (e) {
    console.error("Failed to open directory:", e);
    ElMessage.error("打开目录失败");
  }
}

async function handleBrowse(item: PluginSettingItem) {
  if (!envIsWails) {
    return ElMessage({
      type: "warning",
      message: "此功能浏览器环境不适用"
    })
  }

  try {
    let path: string | null = null;

    if (item.type === "select_dir") {
      path = await OpenDirectoryDialog(item.title);
      if (!path) {
        ElMessage.warning('操作取消');
        return;
      }
      if (item.filesList) {
        const isValid = await AuthDirectory(path, item.filesList);
        if (!isValid) {
          ElMessage.error('所选目录无效或缺少必要文件');
          return;
        }
      }
    } else if (item.type === "select_file") {
      path = await OpenFileDialog(item.title!, item.filters.displayName, item.filters.pattern);
      if (!path) {
        ElMessage.warning('操作取消');
        return;
      }
    }

    if (path) {
      await appConfigStore.appConfig.SetValueOfKey(item.key, path);
      item.value = path;
      ElMessage.success('设置成功');
    }
  } catch (error) {
    console.error("An error occurred during browse handling:", error);
    ElMessage.error("操作失败，请查看控制台日志");
  }
}

</script>

<style scoped>
.settings-section {
  padding: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  transition: all var(--transition-fast);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.settings-section:hover {
  border-color: var(--color-border-secondary);
}

.setting-items-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.setting-items-wrapper.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.setting-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.setting-label {
  flex-shrink: 0;
  width: 120px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.setting-control {
  flex: 1;
  min-width: 0;
}

.directory-control {
  display: flex;
  align-items: center;
}

.directory-input {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  transition: all var(--transition-fast);
}

.directory-control:focus-within .directory-input {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-hover);
}

.browse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  height: 32px;
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  transition: all var(--transition-fast);
  border-left: none;
}

.browse-btn:last-child {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.browse-btn:hover {
  background-color: var(--color-background-tertiary);
  border-color: var(--color-border-secondary);
  z-index: 1;
}

.directory-control:focus-within .browse-btn {
  border-color: var(--color-primary);
  border-left: 1px solid var(--color-primary);
}

@media (max-width: 48rem) {
  .settings-section {
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .setting-label {
    width: auto;
  }

  .setting-control {
    width: 100%;
  }

  .setting-items-wrapper.grid-layout {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .directory-control {
    flex-wrap: wrap;
  }

  .directory-input, .browse-btn {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
  }
}
</style>