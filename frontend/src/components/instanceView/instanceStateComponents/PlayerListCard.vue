<template>
  <div class="player-list">
    <div class="player-list-header">玩家列表</div>

    <div class="un-players" v-if="!playerList">
      <span>当前没有在线玩家</span>
    </div>

    <div v-else style="overflow-y: auto; width: 100%;">
      <div class="player-item" v-for="player in playerList" :key="player.name">
        <div class="player-info">
          <img :src="player.avatarUrl" :alt="`${player.name} 的头像`" class="player-avatar">
          <div class="player-details">
            <p class="player-name">{{ player.name }}</p>
            <p class="player-time">在线时间: {{ formatOnlineTime(currentTime - player.joinTime) }}</p>
      </div>
    </div>
        <div class="player-actions">
          <button class="icon-btn" aria-label="查看资料" @click="$emit('info', player)" @mouseup="infoBtnRef = false"
                  @mousedown="infoBtnRef = true">
            <IconToggle style="transform: translateX(-10px)" :Size="20" :Toggle="infoBtnRef"
                        :FillIcon="IconInfoCardFill"
                        :LineIcon="IconInfoCardLine"
                        :Time="0.01"
            />
          </button>
          <button class="icon-btn" aria-label="发送消息" @click="$emit('message', player)"
                  @mouseup="messageBtnRef = false"
                  @mousedown="messageBtnRef = true">
            <IconToggle style="transform: translateX(-10px)" :Size="20" :Toggle="messageBtnRef"
                        :FillIcon="IconSendPlaneFill"
                        :LineIcon="IconSendPlaneLine"
                        :Time="0.01"
            />
          </button>
          <button class="icon-btn icon-btn-danger" aria-label="踢出玩家" @click="$emit('kick', player)"
                  @mouseup="kickBtnRef = false" @mousedown="kickBtnRef = true">
            <IconToggle style="transform: translateX(-10px)" :Size="20" :Toggle="kickBtnRef"
                        :FillIcon="IconArrowRightBoxFill"
                        :LineIcon="IconArrowRightBoxLine"
                        :Time="0.01"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconArrowRightBoxFill,
  IconArrowRightBoxLine,
  IconInfoCardFill,
  IconInfoCardLine,
  IconSendPlaneFill,
  IconSendPlaneLine
} from "birdpaper-icon"
import {usePlayerListStore} from "../../../stores/playerListStore";
import {computed, onMounted, onUnmounted, ref} from "vue";
import IconToggle from "../../IconToggle.vue";
import {formatOnlineTime} from "../../../utils/date";

const props = defineProps<{
  id: string;
}>()

const playerListStore = usePlayerListStore()
const playerList = computed(() => playerListStore.servers[props.id] || [])

window.addEventListener('keydown', (e) => {
  if (e.key === 'a') {
    playerListStore.parseLogMessage(props.id, "[2025-09-29 10:00:00 INFO] Player Spawned: Steve xuid: 123456789");
    playerListStore.parseLogMessage(props.id, "[2025-09-29 10:00:00 INFO] Player Spawned: Stevafe xuid: 12345a6789");
    playerListStore.parseLogMessage(props.id, "[2025-09-29 10:00:00 INFO] Player Spawned: Staweve xuid: 123456e789");
    playerListStore.parseLogMessage(props.id, "[2025-09-29 10:00:00 INFO] Player Spawned: Stdceve xuid: 12345wa6789");
    playerListStore.parseLogMessage(props.id, "[2025-09-29 10:00:00 INFO] Player Spawned: Steawe xuid: 12345av6789");
    playerListStore.parseLogMessage(props.id, "[2025-09-29 10:00:00 INFO] Player Spawned: Stcweve xuid: 1234d56789");
  }
})
const infoBtnRef = ref<boolean>(false)
const messageBtnRef = ref<boolean>(false)
const kickBtnRef = ref<boolean>(false)
const currentTime = ref(Date.now())

let timeUpdateTimer: number | null = null
onMounted(() => {
  timeUpdateTimer = window.setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timeUpdateTimer) {
    clearInterval(timeUpdateTimer)
  }
})
</script>

<style scoped>
.player-list {
  width: 100%;
  height: 100%;

  background-color: var(--color-background-elevated);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-default);

  display: flex;
  flex-direction: column;
}

.player-list-header {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  border-bottom: 1px solid var(--color-border-secondary);
  margin-bottom: 8px;
}

.un-players {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
}

.un-players span {
  padding: 5px;
  font-size: 16px;
  color: var(--color-text-secondary);
  background-color: var(--color-primary-disabled);
  font-weight: 400;
  text-align: center;
  opacity: 0.5;
  user-select: none;
  pointer-events: none;
}

.player-item {
  width: 95%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--color-background-tertiary);
  border-radius: 6px;
  background-color: var(--color-background);
  margin: 0 auto 8px;
  box-shadow: var(--shadow-default);
  transition: all 0.2s ease;
}

.player-item:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-5px);
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
  color: var(--color-text);
  margin: 0 0 4px 0;
}

.player-time {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
}

.player-actions {
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
  color: var(--color-text);
  background-color: var(--color-background-tertiary);
}

.icon-btn-danger:hover {
  color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
}
</style>