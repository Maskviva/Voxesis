<template>
  <div class="player-item">
    <div class="player-info">
      <!-- 更好的 alt 文本 -->
      <img :src="player.avatarUrl" :alt="`${player.name} 的头像`" class="player-avatar">
      <div class="player-details">
        <p class="player-name">{{ player.name }}</p>
        <p class="player-time">在线时间: {{ onlineTime }}</p>
      </div>
    </div>
    <div class="player-actions">
      <!-- 使用 aria-label 提升可访问性，并通过 $emit 触发事件 -->
      <button class="icon-btn" aria-label="查看资料" @click="$emit('info', player)" @mouseup="infoBtnRef = false"
              @mousedown="infoBtnRef = true">
        <IconToggle style="transform: translateX(-10px)" :Size="20" :Toggle="infoBtnRef"
                    :FillIcon="IconInfoCardFill"
                    :LineIcon="IconInfoCardLine"/>
      </button>
      <button class="icon-btn" aria-label="发送消息" @click="$emit('message', player)" @mouseup="messageBtnRef = false"
              @mousedown="messageBtnRef = true">
        <IconToggle style="transform: translateX(-10px)" :Size="20" :Toggle="messageBtnRef"
                    :FillIcon="IconSendPlaneFill"
                    :LineIcon="IconSendPlaneLine"/>
      </button>
      <button class="icon-btn icon-btn-danger" aria-label="踢出玩家" @click="$emit('kick', player)"
              @mouseup="kickBtnRef = false" @mousedown="kickBtnRef = true">
        <IconToggle style="transform: translateX(-10px)" :Size="20" :Toggle="kickBtnRef"
                    :FillIcon="IconArrowRightBoxFill"
                    :LineIcon="IconArrowRightBoxLine"/>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import {
  IconArrowRightBoxFill,
  IconArrowRightBoxLine,
  IconInfoCardFill,
  IconInfoCardLine,
  IconSendPlaneFill,
  IconSendPlaneLine
} from "birdpaper-icon"
import IconToggle from "./IconToggle.vue";
import {formatOnlineTime} from "../utils/date";

interface Player {
  id: number;
  name: string;
  xuid: string;
  joinTime: number;
  avatarUrl: string;
}

const props = defineProps<{
  player: Player;
}>();

const infoBtnRef = ref<boolean>(false)
const messageBtnRef = ref<boolean>(false)
const kickBtnRef = ref<boolean>(false)

const onlineTime = ref<string>("0d0m0s")

onMounted(() => {
  setInterval(() => {
    const elapsed = Date.now() - new Date(props.player.joinTime).getTime();
    onlineTime.value = formatOnlineTime(elapsed);
  }, 1000)
})

// 定义组件可以触发的事件
defineEmits(['info', 'message', 'kick']);
</script>

<style scoped>
/* 样式从主组件中迁移并保持不变 */
.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  background-color: var(--color-background-header);
  margin-bottom: 16px;
  transition: background-color 0.2s ease;
}

.player-item:hover {
  background-color: var(--color-background-header-hover);
}

.player-info {
  display: flex;
  align-items: center;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
}

.player-details {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
}

.player-time {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
}

.player-actions {
  position: absolute;
  right: 30px;
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  color: var(--color-text-primary);
  background-color: var(--color-background-hover);
}

.icon-btn-danger:hover {
  color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
}
</style>