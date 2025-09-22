import {createApp} from 'vue'
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus'
import BirdpaperIcon from 'birdpaper-icon'

import App from './App.vue'
// import CodeEditor from './CodeEditor.vue'

import './style.css';
import './theme.css';
import 'element-plus/dist/index.css'
import 'birdpaper-icon/dist/index.css'

const url = new URL(window.location.href);
// const app = createApp(url.pathname === '/code-editor' ? CodeEditor : App)
const app = createApp(App)
const pinia = createPinia();

app.use(pinia);
app.use(ElementPlus, {zIndex: 100000})
app.use(BirdpaperIcon)
app.mount('#app')
