import {Window} from "@wailsio/runtime";
import {ref} from "vue";
import {envIsWails} from "../api/common";

export const WinMaxSize = ref(false)

export function winMinimize() {
    if (!envIsWails) return;
    Window.Minimise();
}

export function winToggleMaximise() {
    if (!envIsWails) return;
    Window.ToggleMaximise()
}

export function closeWin() {
    if (!envIsWails) return;
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
