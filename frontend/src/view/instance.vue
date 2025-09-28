<template>
  <div>
    <h1>实例管理</h1>
    <p>管理您的 Minecraft 服务器实例</p>
    <button @click="showCreateModal = true">创建实例</button>

    <div v-if="instanceList.length > 0">
      <InstanceItem v-for="instance in instanceList" :key="instance.name" :instance="instance"/>
    </div>
    <div v-else>
      <h2>暂无实例</h2>
      <p>创建您的第一个 Minecraft 服务器实例</p>
      <button @click="showCreateModal = true">创建实例</button>
    </div>

    <InstanceModal v-if="showCreateModal" @close="showCreateModal = false"/>
  </div>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue'
import {useInstanceStore} from '../stores/mcServerInstanceStore'
import InstanceItem from '../components/instanceView/instanceItem.vue'
import InstanceModal from '../components/instanceView/instanceModal.vue'

const instanceStore = useInstanceStore()
const showCreateModal = ref(false)

onMounted(() => {
  instanceStore.initialize()
})

const instanceList = computed(() => Object.values(instanceStore.instances))
</script>