<template>
  <div ref="componentRef" :style="`width: ${props.Size}px; height: ${props.Size}px;`">
    <component class="Icon" :style="{ opacity: Toggle ? 0 : 1 }" ref="LineIconRef"
               :is="props.LineIcon"
               :size="String(props.Size)" :fill="props.Color"/>
    <component class="Icon" :style="{ opacity: Toggle ? 1 : 0 }" ref="FillIconRef"
               :is="props.FillIcon"
               :size="String(props.Size)" :fill="props.Color"/>
  </div>
</template>

<script setup lang="ts">
import {type Component, ref} from 'vue'

interface Props {
  LineIcon: Component;
  FillIcon: Component;
  Toggle: boolean;
  Size: number;
  Color?: string;
  Time?: number;
}

const props = withDefaults(defineProps<Props>(), {
  Color: '#595959',
  Time: 0.3
})

const LineIconRef = ref()
const FillIconRef = ref()

const time = ref(props.Time + "s")
</script>

<style scoped>
.Icon {
  position: absolute;
  transition: all v-bind(time) ease-in-out;
}
</style>
