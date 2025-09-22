import {Window} from "@wailsio/runtime";
import {isWails} from "../stores/env";
import {ref} from "vue";

export const WinMaxSize = ref(false)

export function winMinimize() {
    if (!isWails) return;
    Window.Minimise();
}

export function winToggleMaximise() {
    if (!isWails) return;
    Window.ToggleMaximise()
}

export function closeWin() {
    if (!isWails) return;
    Window.Hide();
}

// (() => {
//     if (!isWails) return;
//     setInterval(async () => {
//         try {
//             WinMaxSize.value = await Window.IsMaximised();
//         } catch (error) {
//             console.error('检查窗口状态时出错:', error);
//         }
//     }, 400)
// })()
