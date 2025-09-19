<template>
  <div class="content">
    <div class="welcome-container">
      <div class="logo-container" :class="{ 'fade-in': isVisible }">
        <img
            src="../assets/images/logo_no_background.png"
            alt="Voxesis Logo"
            class="app-logo"
            @click="Browser.OpenURL('https://gitee.com/Maskviva/voxesis')"
        />
      </div>

      <div class="welcome-text-container">
        <h1 class="welcome-title" :class="{ 'slide-in-top': isVisible }">
          欢迎使用 Voxesis
        </h1>
        <p class="welcome-subtitle" :class="{ 'slide-in-top-delay-1': isVisible }">
          您的专业 Minecraft 服务器管理面板
        </p>
        <div class="welcome-divider" :class="{ 'expand-divider': isVisible }"></div>
        <p class="welcome-description" :class="{ 'slide-in-top-delay-2': isVisible }">
          通过直观的界面轻松管理您的 Minecraft 服务器。<br>
          开始配置您的服务器或查看仪表板了解详细信息。
        </p>
      </div>

      <div class="quick-actions" :class="{ 'fade-in-delay': isVisible }">
        <button class="action-button primary" @click="AppViewMethod!.toggle_view('dashboard')">
          进入仪表板
        </button>
        <button class="action-button secondary" @click="AppViewMethod!.toggle_view('terminal')">
          打开终端
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {inject, onMounted, onUnmounted, ref} from 'vue';
import {Browser} from "@wailsio/runtime";

const AppViewMethod: { toggle_view: (view: string) => void } | undefined = inject('AppViewMethod')
const isVisible = ref(false);

onMounted(() => {
  // 组件挂载后触发入场动画
  const timeout = setTimeout(() => {
    isVisible.value = true;
  }, 100);

  onUnmounted(() => {
    clearTimeout(timeout);
  })
});
</script>

<style scoped>
.content {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background: var(--color-background-app);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.welcome-container {
  width: 100%;
  max-width: 600px;
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-container {
  margin-bottom: 2rem;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease-out;
}

.logo-container.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.welcome-text-container {
  margin-bottom: 2rem;
}

.welcome-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 1rem 0;
  text-shadow: var(--text-shadow);
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.5s ease-out 0.1s;
}

.welcome-title.slide-in-top {
  opacity: 1;
  transform: translateY(0);
}

.welcome-subtitle {
  font-size: 1.2rem;
  color: var(--color-accent);
  margin: 0 0 1.5rem 0;
  font-weight: 500;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.5s ease-out 0.2s;
}

.welcome-subtitle.slide-in-top-delay-1 {
  opacity: 1;
  transform: translateY(0);
}

.welcome-divider {
  width: 0;
  height: 10px;
  background-color: var(--color-accent);
  margin: 0 auto 1.5rem;
  border-radius: 2px;
  transition: width 0.6s ease-out 0.4s, height 0.4s ease-out 0.6s;
}

.welcome-divider.expand-divider {
  width: 50px;
  height: 3px;
}

.welcome-description {
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.5s ease-out 0.5s;
}

.welcome-description.slide-in-top-delay-2 {
  opacity: 1;
  transform: translateY(0);
}

.quick-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  opacity: 0;
  transition: opacity 0.5s ease-out 0.7s;
}

.quick-actions.fade-in-delay {
  opacity: 1;
}

.action-button {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  outline: none;
}

.primary {
  background-color: var(--color-accent);
  color: white;
}

.primary:hover {
  background-color: var(--color-background-header-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.secondary {
  background-color: var(--color-background-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
}

.secondary:hover {
  background-color: var(--color-background-header);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.app-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.app-logo:hover {
  transform: rotate(360deg) scale(1.2);
}

.app-logo:active {
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .welcome-container {
    padding: 1rem;
  }

  .welcome-title {
    font-size: 1.8rem;
  }

  .welcome-subtitle {
    font-size: 1rem;
  }

  .quick-actions {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }

  .action-button {
    width: 100%;
  }

  .app-logo {
    width: 100px;
    height: 100px;
  }
}
</style>
