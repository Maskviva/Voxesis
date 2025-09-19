<template>
  <div :style="`width: ${props.Size}px; height: ${props.Size}px;`">
    <component class="Icon" :style="{ opacity: Toggle ? 0 : 1 }" ref="LineIconRef"
               :is="props.LineIcon"
               :size="String(props.Size)" :fill="props.Color"/>
    <component class="Icon" :style="{ opacity: Toggle ? 1 : 0 }" ref="FillIconRef"
               :is="props.FillIcon"
               :size="String(props.Size)" :fill="props.Color"/>
  </div>
</template>

<script setup lang="ts">
import {ref, watch, type Component, type PropType} from 'vue'

const props = defineProps(
  {
    LineIcon: {
      type: Object as PropType<Component>,
      required: true
    },
    FillIcon: {
      type: Object as PropType<Component>,
      required: true
    },
    Toggle: {
      type: Boolean,
      required: true
    },
    Size: {
      type: Number,
      required: true
    },
    Color: {
      type: String,
      default: '#595959'
    }
  }
)

const LineIconRef = ref()
const FillIconRef = ref()

const iconName = ref<'LineIcon' | 'FillIcon'>('LineIcon')

watch(props, () => {
  if (props.Toggle) {
    iconName.value = 'FillIcon'
  } else {
    iconName.value = 'LineIcon'
  }
})
</script>

<style scoped>
.Icon {
  position: absolute;
  transition: all 0.3s ease-in-out;
}
</style>
