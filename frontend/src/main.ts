import {createApp} from 'vue'
import ElementPlus from 'element-plus'
import BirdpaperIcon from 'birdpaper-icon'

import App from './App.vue'
import CodeEditor from './CodeEditor.vue'
import './style.css';
import 'element-plus/dist/index.css'
import 'birdpaper-icon/dist/index.css'

const url = new URL(window.location.href);

const app = createApp(url.pathname === '/code-editor' ? CodeEditor : App)

app.use(ElementPlus, {zIndex: 100000})
app.use(BirdpaperIcon)
app.mount('#app')