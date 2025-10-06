<template>
  <div class="component">
    <div class="line">
      <span ref="ballRef" class="ball"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";

const props = withDefaults(defineProps<{
  wight: number;
  height: number;
  size: number;
  min: number;
  max: number;
  reverse?: boolean;
  modelValue?: number;
}>(), {
  modelValue: 0
})

const emit = defineEmits(['update:modelValue']);

const line_direction = ref(props.wight > props.height ? true : props.wight == props.height);
const line_width = ref(Math.max(1, props.wight * (line_direction.value ? 1 : 0)));
const line_height = ref(Math.max(1, props.height * (line_direction.value ? 0 : 1)));

const ballRef = ref<HTMLSpanElement>();

onMounted(() => {
  ballRef.value!.style.top = -(line_direction.value ? props.size / 2 : 0) + "px";
  ballRef.value!.style.left = -(!line_direction.value ? props.size / 2 : 0) + "px";

  // 如果有初始值，设置球的初始位置
  if (props.modelValue !== undefined) {
    const clampedValue = Math.max(props.min, Math.min(props.max, props.modelValue));
    const ratio = (clampedValue - props.min) / (props.max - props.min);

    if (line_direction.value) {
      const maxX = props.wight - props.size;
      const position = maxX * (1 - ratio);
      if (props.reverse) {
        ballRef.value!.style.left = (maxX - position) + "px";
      } else {
        ballRef.value!.style.left = position + "px";
      }
    } else {
      const maxY = props.height - props.size;
      const position = maxY * (1 - ratio);
      if (props.reverse) {
        ballRef.value!.style.top = (maxY - position) + "px";
      } else {
        ballRef.value!.style.top = position + "px";
      }
    }
  }

  ballRef.value!.addEventListener("mousedown", (e) => {
    const ball = ballRef.value!;
    const parent = ball.parentElement!;

    const parentRect = parent.getBoundingClientRect();
    const ballRect = ball.getBoundingClientRect();

    const startX = e.clientX - ballRect.left;
    const startY = e.clientY - ballRect.top;

    const onMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX - startX;
      const mouseY = e.clientY - startY;

      const parentLeft = parentRect.left;
      const parentTop = parentRect.top;
      const parentRight = parentRect.right;
      const parentBottom = parentRect.bottom;

      const ballWidth = ballRect.width;
      const ballHeight = ballRect.height;

      if (line_direction.value) {
        const minX = parentLeft;
        const maxX = parentRight - ballWidth;
        const clampedX = Math.max(minX, Math.min(maxX, mouseX));
        ball.style.left = (clampedX - parentLeft) + "px";

        let ratio = (maxX - clampedX) / (maxX - minX);
        if (props.reverse) {
          ratio = 1 - ratio;
        }
        emit('update:modelValue', ratio * (props.max - props.min) + props.min);
      } else {
        const minY = parentTop;
        const maxY = parentBottom - ballHeight;
        const clampedY = Math.max(minY, Math.min(maxY, mouseY));
        ball.style.top = (clampedY - parentTop) + "px";

        let ratio = (maxY - clampedY) / (maxY - minY);
        if (props.reverse) {
          ratio = 1 - ratio;
        }
        emit('update:modelValue', ratio * (props.max - props.min) + props.min);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
})
</script>

<style scoped>
.component {
  width: v-bind(wight+ "px");
  height: v-bind(height+ "px");

  margin: 0;
  padding: 5px;
  box-sizing: border-box;
  background-color: var(--color-background-secondary);

  display: flex;
  align-items: center;
  justify-content: center;
}

.line {
  width: v-bind(line_width+ "px");
  height: v-bind(line_height+ "px");

  background-color: var(--color-text);
  position: relative;
}

.ball {
  width: v-bind(size+ "px");
  height: v-bind(size+ "px");

  background-color: var(--color-text-secondary);
  border-radius: 50%;
  cursor: grab;

  position: absolute;
}

.ball:active {
  cursor: grabbing;
}
</style>