<template>
  <div class="player-item">
    <div class="player-info">
      <img :src="player.avatarUrl" :alt="`${player.name} 的头像`" class="player-avatar">
      <div class="player-details">
        <p class="player-name">{{ player.name }}</p>
        <p class="player-time">在线时间: {{ formatOnlineTime(currentTime - player.joinTime) }}</p>
      </div>
    </div>
    <div class="player-actions">
      <button class="icon-btn" aria-label="查看资料" @click="PlayerInfoDialogVisible = true"
              @mouseup="infoBtnRef = false"
              @mousedown="infoBtnRef = true">
        <IconToggle style="transform: translateX(-10px)" :Size="20" :Toggle="infoBtnRef"
                    :FillIcon="IconInfoCardFill"
                    :LineIcon="IconInfoCardLine"
                    :Time="0.01"
        />
      </button>
      <button class="icon-btn" aria-label="发送消息" @click="SendMessageDialogVisible = true"
              @mouseup="messageBtnRef = false"
              @mousedown="messageBtnRef = true">
        <IconToggle style="transform: translateX(-10px)" :Size="20" :Toggle="messageBtnRef"
                    :FillIcon="IconSendPlaneFill"
                    :LineIcon="IconSendPlaneLine"
                    :Time="0.01"
        />
      </button>
      <button class="icon-btn icon-btn-danger" aria-label="踢出玩家"
              @click="KickPlayerDialogVisible = true"
              @mouseup="kickBtnRef = false" @mousedown="kickBtnRef = true">
        <IconToggle style="transform: translateX(-10px)" :Size="20" :Toggle="kickBtnRef"
                    :FillIcon="IconArrowRightBoxFill"
                    :LineIcon="IconArrowRightBoxLine"
                    :Time="0.01"
        />
      </button>
    </div>

    <el-dialog v-model="PlayerInfoDialogVisible" :append-to-body="true" :title="player.name + '的玩家信息'">
      <span>名称: {{ player.name }}</span><br/>
      <span>Xuid: {{ player.uid }}</span><br/>
      <span>加入时间: {{ (new Date(player.joinTime)).toLocaleString() }}</span><br/>
      <span>在线时长: {{ formatOnlineTime(Date.now() - player.joinTime) }}</span><br/>
      <template #footer>
        <div>
          <el-button type="primary" @click="PlayerInfoDialogVisible = false">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="SendMessageDialogVisible" :append-to-body="true" :title="'发送给' + player.name">
      <el-input v-model="message" style="width: 98%" placeholder="在这输入发送的消息"/>
      <template #footer>
        <div>
          <el-button type="danger" @click="SendMessageDialogVisible = false">取消</el-button>
          <el-button type="primary"
                     @click='
                     SendMessageDialogVisible = false;
                     SendCommandToMcServer(`tellraw ${player.name} {"rawtext":[{"text":"来自服务器面板: ${message}"}]}`);
                     message = ""'>
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="KickPlayerDialogVisible" :append-to-body="true" :title="'发送给' + player.name">
      <span>你确定要踢出玩家 {{ player.name }} 吗？</span>
      <template #footer>
        <div>
          <el-button type="danger" @click="KickPlayerDialogVisible = false">取消</el-button>
          <el-button type="primary"
                     @click='
                     KickPlayerDialogVisible = false;
                     SendCommandToMcServer(`kick ${player.name}`);
                     message = ""'>
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
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
} from "birdpaper-icon";
import IconToggle from "../../IconToggle.vue";
import {onMounted, onUnmounted, ref} from "vue";
import {Player} from "../../../stores/PlayerListStore";
import {formatOnlineTime} from "../../../utils/date";
import {InstanceState} from "../../../stores/McServerInstanceStore";

const props = defineProps<{
  player: Player;
  instance: InstanceState;
}>()

const infoBtnRef = ref<boolean>(false)
const messageBtnRef = ref<boolean>(false)
const kickBtnRef = ref<boolean>(false)
const currentTime = ref(Date.now())
const message = ref("")
const KickPlayerDialogVisible = ref(false)
const SendMessageDialogVisible = ref(false)
const PlayerInfoDialogVisible = ref(false)

const SendCommandToMcServer = (command: string) => {
  props.instance.serverManager.sendCommand(command)
}

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