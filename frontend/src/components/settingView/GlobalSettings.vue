<template>
  <div>
    <div class="plugin-details-header">
      <div class="plugin-details-title">
        <h1 class="plugin-name fade-in-down">全局设置</h1>
        <p class="plugin-intro fade-in-down delay-1">对原生Voxesis进行设置。</p>
      </div>
    </div>

    <div class="setting-content fade-in-up">
      <p>主题</p>
      <DropDown :callback="toggleTheme" :list="themeList"></DropDown>
    </div>
  </div>
</template>

<script setup lang="ts">
import DropDown from "../custom/DropDown.vue";
import {useThemeStore} from "../../stores/core/ThemeStore";
import {useAppConfigStore} from "../../stores/core/AppConfigStore";
import {ElMessage} from "element-plus";

const appConfigStore = useAppConfigStore();
const themeStore = useThemeStore();
const themeList: {
  label: string;
  value: string | number | boolean;
}[] = Array.from(themeStore.Themes).map(([_, item]) => {
  return {
    label: item.name,
    value: item.theme
  }
})

async function toggleTheme(_: string, theme: string | number | boolean) {
  if (await appConfigStore.appConfig.SetValueOfKey("theme", theme)) {

    await themeStore.ToggleTheme(theme as string)

    ElMessage({
      type: "success",
      message: "切换成功"
    })
  }
}

</script>
<style scoped>
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

.setting-content {
  width: 100%;
  height: 100%;

  padding: 5px;
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

@media (max-width: 48rem) {
  .plugin-name {
    font-size: var(--font-size-lg);
  }
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

</style>