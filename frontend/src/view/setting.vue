<template>
  <div class="setting-container">
    <div class="setting-header fade-in-down">
      <div class="setting-title">设置</div>
    </div>

    <div class="setting-wrapper fade-in-up">
      <div class="settings-section" v-for="plate in plugins" :key="plate.plate">
        <h3 class="section-title">{{ plate.plate }}</h3>
        <div class="setting-items-wrapper"
             :style="plate.display ? {'display': 'grid', 'grid-template-columns': 'repeat(auto-fit, minmax(300px, 1fr))', 'gap': '20px'} : {}">

          <div class="setting-item" v-for="item in plate.items" :key="item.key">
            <label class="setting-label">{{ item.label }}</label>
            <div class="setting-control">

              <DropDown v-if="item.type == 'drop_down'" :list="item.list!" :placeholder="item.placeholder"
                        v-model:value="item.value as string | undefined"/>

              <CustomSwitch v-if="item.type == 'switch'" v-model="item.value as boolean"/>

              <CustomInput v-if="item.type == 'input'"
                           :type="item.value_type as 'number' | 'text' | 'password'"
                           :placeholder="item.placeholder"
                           :max="item.max"
                           :min="item.min"
                           v-model="item.value as string | number"
              />

              <div class="directory-control" v-if="item.type == 'select_dir' || item.type == 'select_file'">
                <input
                    type="text"
                    class="directory-input"
                    v-model="item.value"
                    :placeholder="item.placeholder"
                    readonly
                />
                <button class="browse-btn" @click="handleBrowse(item)">
                  <IconToggle style="transform: translateX(-10px)" :FillIcon="IconFileUploadFill"
                              :LineIcon="IconFileUploadLine" :Size="18" :Toggle="true"/>
                  <span>选择</span>
                </button>
                <button class="browse-btn"
                        @click="openDirectory((item.value as string).replace(/\\/g, '/').replace(/\/[^\/]+\.exe$/, ''))">
                  <IconToggle style="transform: translateX(-10px)" :FillIcon="IconFolderOpenFill"
                              :LineIcon="IconFolderOpenLine" :Size="18" :Toggle="true"/>
                  <span>打开</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div class="settings-section fade-in-up">
        <h3 class="section-title">关于</h3>
        <div class="about-content">
          <p>Voxesis Minecraft 服务器管理面板</p>
          <p>版本: v1.5.0</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DropDown from "../components/DropDown.vue"
import CustomInput from "../components/CustomInput.vue";
import IconToggle from "../components/IconToggle.vue";
import CustomSwitch from "../components/CustomSwitch.vue";
import {ElMessage} from "element-plus"
import {onMounted, Ref, ref, watch} from "vue";
import {IconFileUploadFill, IconFileUploadLine, IconFolderOpenFill, IconFolderOpenLine} from "birdpaper-icon";
import {PluginList, PluginListWait, PluginSetting, PluginSettingItem} from "../stores/PluginData";
import {Browser} from "@wailsio/runtime"
import {AuthDirectory, OpenDirectoryDialog, OpenFileDialog} from "../../bindings/voxesis/src/ipc/fileipc";
import {GetAllAppConfig, UpDataAppConfig} from "../../bindings/voxesis/src/ipc/configipc";

const MOUNTED = ref<boolean>(false);

function upDataTheme(theme: string) {
  if (!MOUNTED.value) return;
  if (theme != "" && theme != 'dark-theme' && theme != 'forest-theme' && theme != 'ocean-theme' && theme != 'sakura-theme' && theme != 'synthwave-theme') return;

  document.body.classList.remove('dark-theme', 'forest-theme', 'ocean-theme', 'sakura-theme', 'synthwave-theme');

  if (theme) document.body.classList.add(theme);
}

function openDirectory(path: string) {
  if (!MOUNTED.value) return;

  if (path == "" || !path) {
    return ElMessage({
      message: '未设置目录',
      type: 'warning',
    })
  }

  Browser.OpenURL(`file://${path}`)
}

function handleBrowse(item: PluginSettingItem) {
  if (!MOUNTED.value) return;

  if (item.type === "select_dir") {
    OpenDirectoryDialog(item.title!).then(path => {
      if (path == "") {
        return ElMessage({
          message: '操作取消',
          type: 'warning',
        })
      }

      if (item.filesList) {
        AuthDirectory(path, item.filesList).then(ok => {
          if (!ok) {
            return ElMessage({
              message: '目录无效',
              type: 'error',
            })
          } else {
            UpDataAppConfig(item.key, path).then(() => {
              item.value = path;
              ElMessage({
                message: '设置成功',
                type: 'success',
              })
            })
          }
        })
      } else {
        UpDataAppConfig(item.key, path).then(() => {
          item.value = path;
          ElMessage({
            message: '设置成功',
            type: 'success',
          })
        })
      }
    })
  } else if (item.type === "select_file") {
    OpenFileDialog(item.title!, item.filters!.displayName, item.filters!.pattern).then(path => {
      if (path == "") {
        return ElMessage({
          message: '操作取消',
          type: 'warning',
        })
      }

      UpDataAppConfig(item.key, path).then(() => {
        item.value = path;
        ElMessage({
          message: '设置成功',
          type: 'success',
        })
      })
    })
  }
}

const plugins: Ref<PluginSetting[]> = ref([
  {
    plate: "外观设置",
    items: [
      {
        label: "主题",
        type: "drop_down",
        key: "theme",
        list: [
          {label: '亮色', value: ''},
          {label: '暗色', value: 'dark-theme'},
          {label: '森林', value: 'forest-theme'},
          {label: '海洋', value: 'ocean-theme'},
          {label: '樱花', value: 'sakura-theme'},
          {label: '朋克', value: 'synthwave-theme'}
        ],
        value: ""
      }
    ]
  },
  {
    plate: "QQ机器人设置",
    display: 'grid',
    items: [
      {
        label: "机器人开关",
        type: "switch",
        key: "qq_bot",
        value: true
      },
      {
        label: "LLOneBot http端口",
        type: "input",
        key: "qq_bot_port",
        value_type: "number",
        value: "",
        max: 65535,
        min: 1,
        placeholder: "请输入LLOneBot http端口"
      },
      {
        label: "LLOneBot token",
        type: "input",
        key: "llonebot_token",
        value_type: "text",
        value: "",
        placeholder: "请输入LLOneBot token"
      },
      {
        label: "QQ群号",
        type: "input",
        key: "qq_group",
        value_type: "text",
        value: "",
        placeholder: "请输入QQ群号"
      }
    ]
  },
  {
    plate: "服务器设置",
    items: [
      {
        label: "MC服务器目录",
        type: "select_dir",
        key: "mc_server_root_path",
        value: "未设置",
        placeholder: "请选择MC服务器目录",
        title: "MC服务器目录选择器",
        filesList: [
          [
            "bedrock_server.exe",
            "server.properties"
          ],
          [
            "bedrock_server_mod.exe",
            "server.properties"
          ]
        ]
      }
    ]
  }
]);

onMounted(() => {
  PluginListWait().then(() => {
    for (let i = 0; i < PluginList.value.length; i++) {
      const plugin = PluginList.value[i];
      const setting = plugin.settings;
      const items = setting.items;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (!item.label || !item.type || !item.value || !item.key) return;
      }

      // 修复问题代码
      let plateFound = false;
      for (let j = 0; j < plugins.value.length; j++) {
        const rawPlugin = plugins.value[j];

        if (rawPlugin.plate == setting.plate) {
          // 将items添加到rawPlugin.items数组中
          rawPlugin.items.push(...items);
          plateFound = true;
          break;
        }
      }

      // 如果没有找到对应的plate，则添加新的设置板块
      if (!plateFound) {
        plugins.value.push({
          plate: setting.plate,
          items
        });
      }
    }
  })

  GetAllAppConfig().then((conf: any) => {
    for (const plugin of plugins.value) {
      for (const item of plugin.items) {
        item.value = conf[item.key];

        watch(item, () => {
              if (!MOUNTED.value) return;
              if (item.type == "select_dir" || item.type == "select_file") return;

              UpDataAppConfig(item.key, item.value).then(() => {
                ElMessage({
                  message: '设置成功',
                  type: 'success',
                })

                upDataTheme(item.value.toString());
              })
            }
        )
      }
    }

    setTimeout(() => MOUNTED.value = true)
  })
})
</script>

<style scoped>
.setting-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background-color: var(--color-background-app);
  overflow-y: auto;
}

.setting-header {
  padding-bottom: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--color-border-default);
}

.setting-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.setting-wrapper {
  flex: 1;
}

.settings-section {
  padding: 24px;
  margin-bottom: 24px;
  background-color: var(--color-background-card);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-header);
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-default);
}

.setting-items-wrapper {
  flex: 1;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 5px;
}

.setting-label {
  flex-shrink: 0;
  width: 150px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.setting-control {
  flex: 1;
  min-width: 0;
}

.directory-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.directory-input {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0 12px;
  font-size: 14px;
  color: var(--color-text-primary);
  background-color: var(--color-background-card);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.directory-input:focus {
  outline: none;
  border-color: var(--color-border-focus);
}

.browse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  color: var(--color-text-primary);
  background-color: var(--color-background-menu);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s, border-color 0.2s;
}

.browse-btn:hover {
  background-color: var(--color-background-menu-hover);
  border-color: var(--color-border-focus);
}

.about-content {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.about-content p {
  margin: 8px 0;
}

.fade-in-down {
  animation: fadeInDown 0.5s ease-out forwards;
}

.fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .setting-container {
    padding: 16px;
  }

  .settings-section {
    padding: 16px;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .setting-label {
    width: auto;
  }

  .setting-control {
    width: 100%;
  }

  .directory-control {
    flex-wrap: wrap;
  }
}
</style>