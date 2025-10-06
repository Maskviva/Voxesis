<template>
  <div class="player-list">
    <div class="player-list-header">玩家列表</div>

    <div class="un-players" v-if="!playerList">
      <span>当前没有在线玩家</span>
    </div>

    <div v-else style="overflow-y: auto; width: 100%;">
      <PlayerCard v-for="player in playerList" :player="player" :instance="instance"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import PlayerCard from "./PlayerCard.vue";
import {InstanceState} from "../../../stores/McServerInstanceStore";
import {usePlayerListStore} from "../../../stores/PlayerListStore";

const props = defineProps<{
  id: number;
  instance: InstanceState;
}>()

const playerListStore = usePlayerListStore()
const playerList = computed(() => playerListStore.servers[props.id] || [])
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
</style>