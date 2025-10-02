<template>
  <div class="terminal-wrapper">
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
</template>

<script setup lang="ts">
import {nextTick, onMounted, ref} from 'vue';
import {ElMessage} from "element-plus";
import {AnsiUp} from "ansi_up/ansi_up";
import {InstanceState, useInstancesStore} from "../../../stores/mcServerInstanceStore";
import {usePlayerListStore} from "../../../stores/playerListStore";

interface TerminalLine {
  type: 'output' | 'command' | 'error' | 'info';
  content: string;
}

const props = defineProps<{
  instance: InstanceState;
}>();

const instancesStore = useInstancesStore();
const playerListStore = usePlayerListStore()
const ansiConverter = new AnsiUp();

const terminalOutput = ref<HTMLElement | null>(null);
const terminalInput = ref<HTMLInputElement | null>(null);
const commandInput = ref('');
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const mouseDownTime = ref(0);

const unRunning = ref(1);
const terminalInitef = ref(false)

const terminalLines = ref<TerminalLine[]>([]);
const terminalLined: string[] = []

instancesStore.subscribeToOutput(props.instance.instanceInfo.id, ({id, data}) => {
  if (id !== props.instance.instanceInfo.id) return;

  if (!terminalInitef.value) {
    terminalLined.push(String(data))
    return;
  }

  data.forEach(line => {
    playerListStore.parseLogMessage(props.instance.instanceInfo.id, line)
  })

  appendLine(String(data))
})

onMounted(() => {
  focusInput();
  instancesStore.instances.forEach(instance => {
    if (instance.instanceInfo.id === props.instance.instanceInfo.id) {
      instance.processState.output.forEach(line => {
        appendLine(line)
      })
    }
  })
  terminalInitef.value = true;

  terminalLined.forEach(line => {
    appendLine(line)
  })

  setTimeout(() => {
    unRunning.value = 0;
  }, 5000)
});

const appendLine = (line: string) => {
  terminalLines.value.push({
    type: 'output',
    content: ansiConverter.ansi_to_html(line),
  })
  scrollToBottom();
};

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

  commandHistory.value.push(command);
  historyIndex.value = commandHistory.value.length;

  instancesStore.sendCommandToInstance(props.instance.instanceInfo.id, command)

  commandInput.value = '';

  scrollToBottom();
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

const handleMouseUp = () => {
  const selection = window.getSelection();
  if (!selection) return;

  const selectedText = selection.toString().trim();
  const currentTime = Date.now();
  const timeDiff = currentTime - mouseDownTime.value;

  if (selectedText && timeDiff > 300) {
    navigator.clipboard.writeText(selectedText)
        .then(() => {
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
.terminal-wrapper {
  flex-grow: 1;
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
</style>