<template>
  <div class="dashboard">
    <div class="section fade-in-down">
      <div class="server-header">
        <div class="server-info">
          <h2 class="server-title">仪表盘</h2>
        </div>
        <div class="server-actions">
          <button class="btn btn-accent" @click="startServer" :disabled="canAction.running || !canAction.action">开启
          </button>
          <button class="btn btn-danger" @click="stopServer" :disabled="!canAction.running || !canAction.allowStop">
            {{ stopButtonLabel }}
          </button>
          <button class="btn btn-secondary" @click="restartServer" :disabled="!canAction.running || !canAction.action">
            重启
          </button>
          <button class="btn btn-primary" @click="OpenCodeEditor('McConfig')">
            配置文件编辑器
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <StatCard
            v-for="(stat, index) in serverStats"
            :key="stat.title"
            :title="stat.title"
            :value="stat.value"
            :description="stat.description"
            :badge-text="stat.badge.text"
            :badge-type="stat.badge.type"
            :icon-class="stat.iconClass"
            :class="`stat-card-animate delay-${index}`"
        />
      </div>
    </div>

    <div class="section-content">
      <div class="card chart-card fade-in-up delay-1">
        <div class="chart-header">
          <h3 class="chart-title">服务器性能监控</h3>
        </div>
        <div class="chart-container">
          <canvas id="performanceChart"></canvas>
        </div>

        <div style="display: flex; flex-direction: row; align-items: center;">
          <CustomSlider :size="10" :wight="80" :height="15" :max="100" :min="5" :reverse="true"
                        v-model="stateShowAmount"/>
          <span style="color: var(--color-text-primary)">显示数量: {{ stateShowAmount.toFixed(0) }}</span>
        </div>
      </div>

      <div class="card fade-in-up delay-2">
        <div class="players-header">
          <h3 class="players-title">在线玩家</h3>
        </div>
        <div class="players-list">
          <PlayerItem
              v-if="PlayerList.length > 0"
              v-for="player in PlayerList"
              :key="player.name"
              :player="player"
              @info="PlayerInfoDialog"
              @message="SendMessageDialog"
              @kick="KickPlayerDialog"
          />
          <div v-else class="no-players">
            <p class="no-players-text">暂无在线玩家</p>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="PlayerInfoDialogVisible" :title="cachePlayer.name + '的玩家信息'">
      <span>名称: {{ cachePlayer.name }}</span><br/>
      <span>Xuid: {{ cachePlayer.xuid }}</span><br/>
      <span>加入时间: {{ (new Date(cachePlayer.joinTime)).toLocaleString() }}</span><br/>
      <span>在线时长: {{ formatOnlineTime(Date.now() - cachePlayer.joinTime) }}</span><br/>
      <template #footer>
        <div>
          <el-button type="primary" @click="PlayerInfoDialogVisible = false">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="SendMessageDialogVisible" :title="'发送给' + cachePlayer.name">
      <el-input v-model="message" style="width: 98%" placeholder="在这输入发送的消息"/>
      <template #footer>
        <div>
          <el-button type="danger" @click="SendMessageDialogVisible = false">取消</el-button>
          <el-button type="primary"
                     @click='
                     SendCommandToMcServer(`tellraw ${cachePlayer.name} {"rawtext":[{"text":"来自服务器面板: ${message}"}]}`);
                     SendMessageDialogVisible = false;
                     message = ""'>
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="KickPlayerDialogVisible" :title="'发送给' + cachePlayer.name">
      <span>你确定要踢出玩家 {{ cachePlayer.name }} 吗？</span>
      <template #footer>
        <div>
          <el-button type="danger" @click="KickPlayerDialogVisible = false">取消</el-button>
          <el-button type="primary"
                     @click='
                     SendCommandToMcServer(`kick ${cachePlayer.name}`);
                     KickPlayerDialogVisible = false;
                     message = ""'>
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, Ref, ref, watch} from 'vue';
import StatCard from '../components/StatCard.vue';
import PlayerItem from '../components/PlayerItem.vue';
import Chart from 'chart.js/auto';
import {PlayerList} from "../stores/PlayerList";
import {formatOnlineTime} from "../utils/date";
import {ElMessage} from "element-plus";
import {IsLeviLamina} from "../stores/McServerLog";
import CustomSlider from "../components/CustomSlider.vue";
import {OsState} from "../../bindings/voxesis/src/core/entity";
import {GetAppConfigByKey} from "../../bindings/voxesis/src/ipc/configipc";
import {
  GetMcServerStatus,
  SendCommandToMcServer,
  StartMcServer,
  StopMcServer
} from "../../bindings/voxesis/src/ipc/mcserveripc";
import {GetOsState} from "../../bindings/voxesis/src/ipc/utilsipc";
import {AddCodeTemp, DeleteCodeTemp, OpenCodeEditor} from "../../bindings/voxesis/src/ipc/code";

interface Player {
  id: number;
  name: string;
  xuid: string;
  joinTime: number;
  avatarUrl: string;
}

// 系统状态
const osState = ref<OsState>({
  CpuCores: 0,
  CpuUsage: 0,
  MemoryUsage: 0,
  OsMemory: 0,
});
// 服务器状态
const serverStats: Ref<{
  title: string,
  value: string,
  description: string,
  badge: { text: string, type: 'success' | 'info' | 'warning' | 'danger' },
  iconClass: string,
}[]> = ref([
  {
    title: '服务器状态',
    value: '未运行',
    description: '已运行: 0d0h0s',
    badge: {text: '离线', type: 'danger'},
    iconClass: 'fa fa-power-off',
  },
  {
    title: '在线玩家',
    value: '0/0',
    description: '最大玩家数: 0',
    badge: {text: '0.0.0', type: 'info'},
    iconClass: 'fa fa-users',
  },
  {
    title: 'CPU 使用率',
    value: '0.00%',
    description: '0核处理器',
    badge: {text: '较低', type: 'success'},
    iconClass: 'fa fa-microchip',
  },
  {
    title: '内存使用',
    value: '0.00MB',
    description: '已使用: 0.00%',
    badge: {text: '正常', type: 'info'},
    iconClass: 'fa fa-memory',
  },
]);
// 是否可以进行操作
const canAction = ref({
  action: true,
  running: false,
  allowStop: true,
});
// 服务器在线状态
const serverOnline = ref(false);
// 停止按钮状态
const stopButtonLabel = ref('停止');
const isStopping = ref(false);
const stopTimeout = ref<NodeJS.Timeout | null>(null);
// 缓存玩家信息
const cachePlayer = ref<Player>({id: 0, joinTime: 0, name: "", xuid: "", avatarUrl: ""});
// 玩家发送消息
const message = ref();
// 状态显示数量
const stateShowAmount = ref(5);
// 对话框
const PlayerInfoDialogVisible = ref(false); // 玩家信息
const SendMessageDialogVisible = ref(false); // 发送消息
const KickPlayerDialogVisible = ref(false); // 踢出玩家
// 对话框方法
const PlayerInfoDialog = (player: Player) => {
  PlayerInfoDialogVisible.value = true;
  cachePlayer.value = player;
}
// 发送消息对话框方法
const SendMessageDialog = (player: Player) => {
  SendMessageDialogVisible.value = true;
  cachePlayer.value = player;
}
// 踢出玩家对话框方法
const KickPlayerDialog = (player: Player) => {
  KickPlayerDialogVisible.value = true;
  cachePlayer.value = player;
}
// 启动服务器方法
const startServer = () => {
  GetAppConfigByKey('mc_server_root_path').then((mc_server_root_path) => {
    if (!mc_server_root_path) {
      ElMessage.error('请先设置服务器根目录');
      return;
    }

    StartMcServer().then((path: any) => {
      if (path.includes("bedrock_server.exe")) {
        IsLeviLamina.value = false;
      } else if (path.includes("bedrock_server_mod.exe")) {
        IsLeviLamina.value = true;
      }
    });
    canAction.value.action = false;
  });
};
// 停止服务器方法
const stopServer = () => {
  if (!isStopping.value) {
    StopMcServer();
    isStopping.value = true;
    stopButtonLabel.value = '强制停止';

    canAction.value.action = false;

    if (stopTimeout.value) {
      clearTimeout(stopTimeout.value);
    }
    stopTimeout.value = setTimeout(() => {
      isStopping.value = false;
      stopButtonLabel.value = '停止';
    }, 5000);
  } else {
    StopMcServer();
    isStopping.value = false;
    stopButtonLabel.value = '停止';
    if (stopTimeout.value) {
      clearTimeout(stopTimeout.value);
      stopTimeout.value = null;
    }
    canAction.value.action = false;
  }
};
// 重启服务器方法
const restartServer = () => {
  canAction.value.action = false;
  StopMcServer().then(() => startServer());
};
// 监听服务器在线状态
watch(serverOnline, () => {
  canAction.value.action = true;
  canAction.value.running = serverOnline.value;

  if (!serverOnline.value) PlayerList.value = [];

  // 重置停止按钮状态
  isStopping.value = false;
  stopButtonLabel.value = '停止';
  if (stopTimeout.value) {
    clearTimeout(stopTimeout.value);
    stopTimeout.value = null;
  }
})

onMounted(() => {
  const ctx = document.getElementById('performanceChart');
  const stateHistory: {
    time: string[],
    cpu: number[],
    memory: number[],
  } = {
    time: [],
    cpu: [],
    memory: [],
  }
  const chartLabels = ref<string[]>([]);
  const cpuData = ref<number[]>([]);
  const memoryData = ref<number[]>([]);

  // 创建图表实例引用
  let chartInstance: Chart | null = null;

  GetOsState().then((state: any) => {
    osState.value = state;
  })

  if (ctx) {
    chartInstance = new Chart(<HTMLCanvasElement>ctx, {
      type: 'line',
      data: {
        labels: chartLabels.value,
        datasets: [
          {
            label: 'CPU 使用率 (%)',
            data: cpuData.value,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: '内存使用率 (%)',
            data: memoryData.value,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      },
    });
  }

  function updata(state: any) {
    if (stateHistory.cpu.length == 100) stateHistory.cpu.shift();
    if (stateHistory.memory.length == 100) stateHistory.memory.shift();
    if (stateHistory.time.length == 100) stateHistory.time.shift();

    stateHistory.cpu.push(state.cpu || 0);
    stateHistory.memory.push(state.memory || 0);
    stateHistory.time.push(new Date().toLocaleTimeString());

    // 通过stateHistory映射生成最新的b个元素
    cpuData.value = stateHistory.cpu.slice(-stateShowAmount.value.toFixed(0));
    memoryData.value = stateHistory.memory.slice(-stateShowAmount.value.toFixed(0));
    chartLabels.value = stateHistory.time.slice(-stateShowAmount.value.toFixed(0));

    // 更新图表数据
    if (chartInstance) {
      chartInstance.data.datasets[0].data = cpuData.value;
      chartInstance.data.datasets[1].data = memoryData.value;
      chartInstance.data.labels = chartLabels.value;
      chartInstance.update();
    }

    serverStats.value = [
      {
        title: '服务器状态',
        value: serverOnline.value ? '运行中' : "未运行",
        description: '已运行: ' + (state.runTime || '0s'),
        badge: {text: serverOnline.value ? '在线' : '离线', type: serverOnline.value ? 'success' : "danger"},
        iconClass: 'fa fa-power-off',
      },
      {
        title: '在线玩家',
        value: (state.players_online || 0) + '/' + (state.players_max || 0),
        description: '最大玩家数: ' + (state.players_max || 0),
        badge: {text: state.version || "0.0.0", type: 'info'},
        iconClass: 'fa fa-users',
      },
      {
        title: 'CPU 使用率',
        value: state.cpu.toFixed(2) + "%",
        description: osState.value.CpuCores + '核处理器',
        badge: {
          text: state.cpu < 10 ? '较低' : state.cpu < 70 ? '中等' : '较高',
          type: state.cpu < 10 ? 'success' : state.cpu < 70 ? 'warning' : 'danger'
        },
        iconClass: 'fa fa-microchip',
      },
      {
        title: '内存使用',
        value: state.memory.toFixed(2) + "MB",
        description: '已使用: ' + (state.memory / osState.value.OsMemory * 100).toFixed(2) + "%",
        badge: {text: '正常', type: 'info'},
        iconClass: 'fa fa-memory',
      },
    ];
  }

  const interval = setInterval(() => {
    GetMcServerStatus().then((state: any) => {
      updata(state)
      // 正确更新数组数据
      serverOnline.value = true;
    }).catch(_ => {
      serverOnline.value = false;

      updata({cpu: 0, memory: 0, pid: '', runTime: ''})
    });
  }, 1000); // 增加间隔时间

  DeleteCodeTemp("McConfig").then(() => {
    GetAppConfigByKey("mc_server_root_path").then(path => {
      AddCodeTemp({
        Name: "McConfig",
        Type: "properties",
        Path: path + "\\server.properties"
      })
    })
  })

  onUnmounted(() => {
    clearInterval(interval)
  })
});
</script>

<style scoped>
/* 样式保持不变 */
.dashboard {
  width: 100%;
  height: 100%;

  padding: 24px;
  background-color: var(--color-background-app);
  overflow-y: auto;

  display: flex;
  flex-direction: column;
}

.section {
  margin-bottom: 32px;
}

.server-header {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--color-border-default);
  gap: 16px;
}

@media (min-width: 768px) {
  .server-header {
    flex-direction: row;
    align-items: center;
  }
}

.server-info .server-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.server-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  transform: translateY(-8px);
}

.btn {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-4px);
}

.btn:active {
  transform: translateY(1px);
}

.btn:disabled {
  cursor: no-drop;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-accent {
  background-color: #42b883;
  color: white;
}

.btn-accent:hover {
  background-color: #359c6d;
}

.btn-secondary {
  background-color: #d0c618;
  color: white;
}

.btn-secondary:hover {
  background-color: #a9a000;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 24px;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.card {
  background-color: var(--color-background-card);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--card-shadow);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: var(--card-hover-shadow);
}

.section-content {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 24px;
}

@media (min-width: 1024px) {
  .section-content {
    grid-template-columns: 2fr 1fr;
  }
}

.chart-card {
  width: auto;
  overflow: hidden;
}

.chart-header, .players-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.chart-title, .players-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.chart-container {
  width: 100%;
  height: 80%;
}

.players-list {
  height: 300px;
  overflow-y: auto;
}

.no-players {
  text-align: center;
  color: var(--color-text-secondary);
  margin-top: 20px;
}

.no-players-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-top: 20px;
}

.fade-in-down {
  animation: fadeInDown 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(-20px);
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

.delay-1 {
  animation-delay: 0.2s;
}

.delay-2 {
  animation-delay: 0.3s;
}

@keyframes fadeInDown {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
