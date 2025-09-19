<template>
  <div class="terminal-container">
    <div class="terminal-header fade-in-down">
      <div class="terminal-title">服务器终端</div>
      <div class="terminal-controls">
        <button class="control-btn" @click="clearTerminal" @mouseleave="clickedBtn = ''" @mouseenter="clickedBtn = 'clean'">
          <IconToggle class="control-btn-icon" :Size="18"
                      :Toggle="clickedBtn == 'clean'"
                      :FillIcon="IconFileCloseFill" :LineIcon="IconFileCloseLine"/>
          清屏
        </button>
        <button class="control-btn" @click="copyTerminal" @mouseleave="clickedBtn = ''" @mouseenter="clickedBtn = 'copy'">
          <IconToggle class="control-btn-icon" :Size="18"
                      :Toggle="clickedBtn == 'copy'"
                      :FillIcon="IconFileCopy2Fill" :LineIcon="IconFileCopy2Line"/>
          复制
        </button>
      </div>
    </div>

    <div class="terminal-wrapper fade-in-up">
      <div
          ref="terminalOutput"
          class="terminal-output"
          @click="focusInput"
          @mouseup="handleMouseUp"
      >
        <div
            v-for="(line, index) in terminalLines"
            :key="index"
            class="terminal-line"
            :style="{ animationDelay: ((terminalLines.length-1 -  index) * 0.05 * unRunning) + 's' }"
        >
          <span v-if="line.type === 'command'" class="prompt">$</span>
          <span v-html="line.content"></span>
        </div>

        <div class="terminal-input-line">
          <span class="prompt">$</span>
          <input
              ref="terminalInput"
              v-model="commandInput"
              type="text"
              class="terminal-input"
              @keyup.enter="executeCommand"
              @keyup.up="previousCommand"
              @keyup.down="nextCommand"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {nextTick, onMounted, ref, watch} from 'vue';
import {IconFileCloseFill, IconFileCloseLine, IconFileCopy2Fill, IconFileCopy2Line} from "birdpaper-icon"
import IconToggle from "../components/IconToggle.vue"
import {mc_logs, removeAnsiCodes} from '../stores/McServerLog';
import {ElMessage} from "element-plus";
import {SendCommandToMcServer} from "../../bindings/voxesis/src/ipc/mcserveripc";

interface TerminalLine {
  type: 'output' | 'command' | 'error' | 'info';
  content: string;
}

const clickedBtn = ref<string>("")
const terminalOutput = ref<HTMLElement | null>(null);
const terminalInput = ref<HTMLInputElement | null>(null);
const commandInput = ref('');
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const mouseDownTime = ref(0);

const unRunning = ref(1);

const terminalLines = ref<TerminalLine[]>([]);

// 监听日志变化并添加到终端
mc_logs.value.forEach(log => {
  terminalLines.value.push({
    type: 'output',
    content: log.content
  });
});

// 监听logs的变化，将新日志添加到终端
watch(mc_logs, (newLogs) => {
  const lastLog = newLogs[newLogs.length - 1];
  if (lastLog) {
    terminalLines.value.push({
      type: 'output',
      content: lastLog.content,
    });

    scrollToBottom();
  }
}, {deep: true});

onMounted(() => {
  focusInput();

  setTimeout(() => {
    unRunning.value = 0;
  }, 5000)
});

const focusInput = () => {
  if (terminalInput.value) {
    terminalInput.value.focus();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (terminalOutput.value) {
      terminalOutput.value.scrollTop = terminalOutput.value.scrollHeight;
    }
  });
};

const executeCommand = () => {
  const command = commandInput.value.trim();

  if (!command) return;

  // 添加到历史记录
  commandHistory.value.push(command);
  historyIndex.value = commandHistory.value.length;

  SendCommandToMcServer(command)

  // 清空输入框
  commandInput.value = '';

  // 滚动到底部
  scrollToBottom();
};

const clearTerminal = () => {
  terminalLines.value = [];
};

const copyTerminal = () => {
  const text = mc_logs.value.map(log => {
    return log.raw || removeAnsiCodes(log.content);
  }).join('\n');

  navigator.clipboard.writeText(text)
      .then(() => {
        terminalLines.value.push({
          type: 'info',
          content: '终端内容已复制到剪贴板'
        });
        scrollToBottom();

        setTimeout(() => {
          if (terminalLines.value.length > 0 &&
              terminalLines.value[terminalLines.value.length - 1].content === '终端内容已复制到剪贴板') {
            terminalLines.value.pop();
          }
        }, 3000);
      })
      .catch(err => {
        terminalLines.value.push({
          type: 'error',
          content: '复制失败: ' + err
        });
      });
};

const previousCommand = () => {
  if (commandHistory.value.length === 0) return;

  if (historyIndex.value === -1 || historyIndex.value > commandHistory.value.length - 1) {
    historyIndex.value = commandHistory.value.length - 1;
  } else if (historyIndex.value > 0) {
    historyIndex.value--;
  }

  commandInput.value = commandHistory.value[historyIndex.value] || '';
};

const nextCommand = () => {
  if (commandHistory.value.length === 0 || historyIndex.value === -1) return;

  if (historyIndex.value < commandHistory.value.length - 1) {
    historyIndex.value++;
    commandInput.value = commandHistory.value[historyIndex.value] || '';
  } else {
    historyIndex.value = -1;
    commandInput.value = '';
  }
};

// 处理鼠标释放事件
const handleMouseUp = () => {
  const selection = window.getSelection();
  if (!selection) return;

  const selectedText = selection.toString().trim();
  const currentTime = Date.now();
  const timeDiff = currentTime - mouseDownTime.value;

  // 如果选择的文本不为空且长按时间超过300毫秒，复制到剪贴板
  if (selectedText && timeDiff > 300) {
    navigator.clipboard.writeText(selectedText)
        .then(() => {
          // 显示复制成功提示
          ElMessage({
            message: '已复制内容到剪贴板',
            type: 'success',
          })

          scrollToBottom();
        })
        .catch(err => {
          terminalLines.value.push({
            type: 'error',
            content: '复制失败: ' + err
          });
        });
  }
};
</script>

<style scoped>
.terminal-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background-app);
  padding: 24px;
  box-sizing: border-box;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-default);
}

.terminal-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--color-text-primary);
}

.terminal-controls {
  display: flex;
  gap: 12px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--color-background-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background-color: var(--color-accent);
  color: var(--color-text-header);
  border-color: var(--color-accent);
}

.control-btn-icon {
  transform: translateX(-10px);
}

.terminal-wrapper {
  flex: 1;
  background-color: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.terminal-output {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #f0f0f0;
  background-color: #1e1e1e;
  white-space: pre-wrap;
  word-break: break-word;
}

.terminal-line {
  margin: 0;
  opacity: 0;
  transform: translateY(10px);
  animation: fadeInUp 0.3s ease forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.terminal-line.output {
  color: #f0f0f0;
}

.terminal-line.command {
  color: #50fa7b;
  font-weight: bold;
}

.terminal-line.error {
  color: #ff6b6b;
}

.terminal-line.info {
  color: #4cc9f0;
}

.prompt {
  color: #50fa7b;
  font-weight: bold;
  margin-right: 8px;
}

.terminal-input-line {
  display: flex;
  align-items: center;
}

.terminal-input {
  flex: 1;
  background-color: transparent;
  border: none;
  color: #f0f0f0;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  outline: none;
  caret-color: #f0f0f0;
}

.terminal-input::placeholder {
  color: #666;
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
