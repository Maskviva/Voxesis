import {Window} from "@wailsio/runtime";

export function winMinimize() {
    Window.Minimise();
}

export function winMaximize() {
    Window.ToggleMaximise()
}

export function closeWin() {
    Window.Hide();
}

export function watchWindowState(callback: (isMaximized: boolean) => void) {
    const checkWindowState = async () => {
        try {
            const isMaximized = await Window.IsMaximised();
            callback(isMaximized);
        } catch (error) {
            console.error('检查窗口状态时出错:', error);
        }
    };

    const intervalId = setInterval(checkWindowState, 500);

    return () => {
        clearInterval(intervalId);
    };
}