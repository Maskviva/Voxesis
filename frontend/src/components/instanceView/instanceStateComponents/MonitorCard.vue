<template>
  <div class="card">
    <div class="card-header">监控</div>
    <div class="card-content">
      <div class="monitor-stats">
        <span v-for="s in series" :key="s.label" class="stat">
          <span class="stat-color-dot" :style="{ backgroundColor: s.color }"></span>
          {{ s.label }}:&nbsp;<strong>{{ s.status }}</strong>
        </span>
      </div>

      <div ref="chartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref, watch} from 'vue';
import * as echarts from 'echarts/core';
import {GridComponent, LegendComponent, TooltipComponent,} from 'echarts/components';
import {LineChart} from 'echarts/charts';
import {CanvasRenderer} from 'echarts/renderers';
import {UniversalTransition} from 'echarts/features';
import {ServersState} from "../../../instance/mcServerInstanceManager";

echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition
]);

export interface ChartDataPoint {
  time: string;
  value: number;
}

export interface Series {
  label: string;
  status: string;
  color: string;
  data: ChartDataPoint[];
}

const props = defineProps<{
  series: Series[];
}>();

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

function setChartOption() {
  if (!chartInstance || !props.series.length || !props.series[0].data.length) {
    return;
  }

  const option = {
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.series[0].data.map(d => d.time),
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: props.series.map(s => ({
      name: s.label,
      type: 'line',
      smooth: false,         // 平滑曲线
      showSymbol: false,    // 不显示数据点标记，更简洁
      data: s.data.map(d => d.value),
      itemStyle: {
        color: s.color,
      },
      lineStyle: {
        color: s.color,
        width: 2,
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: `${s.color}80` // 顶部颜色，约50%透明度
          },
          {
            offset: 1,
            color: `${s.color}00` // 底部颜色，完全透明
          }
        ])
      }
    })),
  };

  chartInstance.setOption(option);
}

onMounted(() => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value);

    setChartOption();

    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize();
    });
    resizeObserver.observe(chartRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver && chartRef.value) {
    resizeObserver.unobserve(chartRef.value);
  }
  chartInstance?.dispose();
});

watch(() => props.series, setChartOption, {deep: true});

</script>

<style scoped>
.card {
  background-color: var(--color-background-elevated);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-default);
  margin-bottom: var(--spacing-lg);
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  border-bottom: 1px solid var(--color-border-secondary);
  flex-shrink: 0;
}

.card-content {
  padding: var(--spacing-lg);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.monitor-stats {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.stat {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
}

.stat-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  display: inline-block;
}

.chart-container {
  width: 100%;
  height: 250px;
  flex-grow: 1;
  min-height: 200px;
}
</style>