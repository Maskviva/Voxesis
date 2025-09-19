import * as Vue from "vue";
import {defineAsyncComponent, ref, Ref, shallowRef} from "vue";
import {ElMessage} from "element-plus";
import * as BirdpaperIcon from "birdpaper-icon";
import * as bindIngs from "../../bindings/voxesis/src/ipc";
import * as WailsRunTime from "@wailsio/runtime"
import {GetPluginList} from "../../bindings/voxesis/src/ipc/pluginipc";

declare const System: any;
declare global {
    interface Window {
        System: any;
    }
}

export type PluginSettingItem = {
    label: string,
    type: "input" | "drop_down" | "switch" | "select_dir" | "select_file",
    key: string,
    value_type?: "number" | "text" | "password",
    title?: string,
    filters?: {
        displayName: string,
        pattern: string,
    },
    filesList?: string[][],
    value: string | boolean,
    max?: number,
    min?: number,
    placeholder?: string,
    list?: { label: string, value: string }[],
}

export type PluginSetting = {
    plate: string,
    display?: string,
    items: PluginSettingItem[]
};

type PluginView = {
    name: string;
    component: any,
    introduce: string;
    line_icon: any;
    fill_icon: any;
    settings: PluginSetting;
}

interface PluginManifest extends PluginView {
    main: string;
}

const PluginListLoadState = ref(false)

export const PluginList: Ref<PluginView[]> = shallowRef([])

export function PluginListWait() {
    return new Promise((resolve, reject) => {
        if (PluginListLoadState.value) {
            resolve(PluginList.value)
        } else {
            // 如果插件列表尚未加载，等待加载完成
            const checkInterval = setInterval(() => {
                if (PluginListLoadState.value) {
                    clearInterval(checkInterval)
                    resolve(PluginList.value)
                }
            }, 100)

            // 设置超时时间，避免无限等待
            setTimeout(() => {
                clearInterval(checkInterval)
                reject(new Error('Plugin list load timeout'))
            }, 10000)
        }
    })
}

function parse_manifest(plugin_manifest: string): PluginManifest {
    const binaryString = atob(plugin_manifest);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    let manifestString;

    try {
        manifestString = new TextDecoder('utf-8').decode(bytes);
        JSON.parse(manifestString);
    } catch (utf8Error) {
        try {
            manifestString = new TextDecoder('gbk').decode(bytes);
            JSON.parse(manifestString);
        } catch (gbkError) {
            manifestString = binaryString;
        }
    }

    // 解析JSON
    return JSON.parse(manifestString);
}

function isValidManifest(manifest: any): manifest is PluginManifest {
    return manifest &&
        typeof manifest.name === 'string' &&
        typeof manifest.introduce === 'string' &&
        typeof manifest.line_icon === 'string' &&
        typeof manifest.fill_icon === 'string';
}

export async function LoadPluginList(): Promise<void> {
    const plugins = await GetPluginList()

    for (const plugin of plugins) {
        // 解析JSON
        const manifest: Ref<PluginManifest> = ref(parse_manifest(plugin.Manifest));

        if (isValidManifest(manifest.value)) {
            const pluginPath = `/plugins/${manifest.value.name}/${manifest.value.main}`;
            const pluginComponent = defineAsyncComponent(() => PluginLoader(pluginPath) as any)

            const PluginView = {
                name: manifest.value.name,
                component: pluginComponent,
                introduce: manifest.value.introduce,
                line_icon: (BirdpaperIcon as any)[manifest.value.line_icon],
                fill_icon: (BirdpaperIcon as any)[manifest.value.fill_icon],
                settings: manifest.value.settings
            }

            console.log(PluginView)

            PluginList.value.push(PluginView)
        } else {
            ElMessage({
                message: `插件 ${plugin.PluginName ?? manifest.value} 加载失败`,
                type: 'error',
            })
        }
    }

    PluginListLoadState.value = true
}

async function PluginLoader(path: string) {
    if (!path) return

    console.log('[Voxesis Plugin Loader] 开始加载插件...');

    await new Promise<void>((resolve, reject) => {
        if (window.System) return resolve();
        const script = document.createElement('script');
        script.src = 'src/assets/lib/system.js';
        script.onload = () => resolve();
        script.onerror = _ => reject(new Error('无法加载 SystemJS 库'));
        document.head.appendChild(script);
    });
    console.log('[Voxesis Plugin Loader] SystemJS 库已加载。');

    const vuePseudoURL = 'app://vue';
    const wailsRunTimePseudoURL = "app://wailsRunTime"
    const wailsIpcPseudoURL = 'app://wailsIpc'

    const importMap = {
        imports: {
            "vue": vuePseudoURL,
            "WailsRunTime": wailsRunTimePseudoURL,
            "WailsIpc": wailsIpcPseudoURL,
            "configipc": wailsIpcPseudoURL,
            "fileipc": wailsIpcPseudoURL,
            "logipc": wailsIpcPseudoURL,
            "mcserveripc": wailsIpcPseudoURL,
            "pluginipc": wailsIpcPseudoURL,
            "processipc": wailsIpcPseudoURL,
            "utilsipc": wailsIpcPseudoURL
        }
    };

    if (!document.querySelector('script[type="systemjs-importmap"]')) {
        const imScript = document.createElement('script');
        imScript.type = 'systemjs-importmap';
        imScript.textContent = JSON.stringify(importMap);
        document.head.appendChild(imScript);
        System.prepareImport();
        console.log('[Voxesis Plugin Loader] SystemJS Import Map 已添加。');
    }

    const wailsIpcWithSubmodules = {
        ...bindIngs,
        default: bindIngs,
        ConfigIpc: bindIngs.ConfigIpc,
        FileIpc: bindIngs.FileIpc,
        LogIpc: bindIngs.LogIpc,
        McServerIpc: bindIngs.McServerIpc,
        PluginIpc: bindIngs.PluginIpc,
        ProcessIpc: bindIngs.ProcessIpc,
        UtilsIpc: bindIngs.UtilsIpc
    };

    System.set(vuePseudoURL, Vue);
    System.set(wailsRunTimePseudoURL, WailsRunTime)
    System.set(wailsIpcPseudoURL, wailsIpcWithSubmodules);
    console.log('[Voxesis Plugin Loader] 主应用的 Vue 实例已通过伪 URL 注册到 SystemJS。');

    const SourceFileResponse: Response = await fetch(path)
    const SourceFile = await SourceFileResponse.json()
    const blob = new Blob([SourceFile], {type: 'application/javascript'});
    const url = URL.createObjectURL(blob);

    const module = await System.import(url);

    URL.revokeObjectURL(url);

    console.log('[Voxesis Plugin Loader] 插件组件已成功加载并准备渲染。');
    return module.default;
}