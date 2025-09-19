<template>
  <div class="code-editor-container">
    <ul class="navbar">
      <li class="navbar-item" v-for="item in NavbarItems">
        <span>{{ item.label }}</span>
        <ul class="navbar-item-child" v-if="item.children">
          <li v-for="child in item.children" @click="child.click()">
            <span>{{ child.label }}</span>
          </li>
        </ul>
      </li>
    </ul>
    <div ref="EditorContainer" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import {GetCodeTemp, UpdateCodeTemp} from "../bindings/voxesis/src/ipc/code"
import {Window} from "@wailsio/runtime"
import * as monaco from 'monaco-editor';
import {ref} from "vue";

const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');

const NavbarItems = [
  {
    label: "文件",
    children: [
      {
        label: "保存",
        click: () => {
          save_file()
        }
      },
      {
        label: "关闭",
        click: () => {
          save_file().then(() => {
            Window.Close()
          })
        }
      }
    ]
  }
]

const EditorContainer = ref()
let FileType: null | string = null

window.MonacoEnvironment = {
  getWorkerUrl: function (workerId, label) {
    if (label === 'json') {
      return './node_modules/monaco-editor/esm/vs/language/json/json.worker.js';
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return './node_modules/monaco-editor/esm/vs/language/css/css.worker.js';
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './node_modules/monaco-editor/esm/vs/language/html/html.worker.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return './node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js';
    }
    return './node_modules/monaco-editor/esm/vs/editor/editor.worker.js';
  }
};
monaco.languages.register({id: 'properties'});
monaco.languages.setMonarchTokensProvider('properties', {
  keywords: [],
  tokenizer: {
    root: [
      [/^[#!].*$/, 'comment'],
      [/(^[\w\d._-]+)(\s*[:=])(\s*)/, ['key', 'operator', 'white']],
      [/(.*)$/, 'value']
    ]
  }
});

GetCodeTemp(name!).then((codeTemp) => {
  monaco_editor_init(codeTemp!.Content, codeTemp!.Type);
  FileType = codeTemp!.Type
})

function save_file() {
  if (FileType == 'json') return UpdateCodeTemp(name!, EditorContainer.value.querySelector(".monaco-editor").querySelector(".view-lines").textContent.replace(/\r?\s+/g, ''))
  return UpdateCodeTemp(name!, EditorContainer.value.querySelector(".monaco-editor").querySelector(".view-lines").textContent)
}

function monaco_editor_init(text: string, model: string) {
  const app = EditorContainer.value;

  const editor = monaco.editor.create(app!, {
    theme: "vs-dark", // 编辑器主题
    readOnly: false, // 是否只读
    automaticLayout: true, // 自动布局
  });

  const originalModel = monaco.editor.createModel(text, model);

  editor.setModel(originalModel);

  // 添加保存功能示例
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => save_file())

  setTimeout(() => {
    editor.getAction('editor.action.formatDocument')!.run();
  }, 100);
}
</script>

<style scoped>
.code-editor-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  background-color: #1E1E1E;
  color: white;
  padding: 0;
  margin: 0;
  list-style: none;
  height: 20px;
  align-items: center;
}

.navbar-item {
  position: relative;
  padding: 0 15px;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.navbar-item:hover {
  background-color: #555;
}

.navbar-item span {
  margin-right: 5px;
  font-size: 12px;
}

.navbar-item-child {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #333;
  list-style: none;
  padding: 5px 0;
  margin: 0;
  min-width: 120px;
  display: none;
  z-index: 100;
}

.navbar-item:hover .navbar-item-child {
  display: block;
}

.navbar-item-child li {
  padding: 2px 15px;
}

.navbar-item-child li:hover {
  background-color: #555;
}

.editor-container {
  flex: 1;
  width: 100%;
  min-height: 0;
}
</style>
