import * as Vue from "vue";
import {defineAsyncComponent, markRaw, readonly, ref, toRef} from "vue";
import {defineStore} from "pinia";
import {ElNotification} from "element-plus";
import * as WailsRunTime from '@wailsio/runtime';
import Plugins, {GetPluginList, LoadPlugins} from "../../api/plugins";
import Utils from "../../api/utils";
import Config from "../../api/config";
import {Api} from "../../api";

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
};

export type PluginSetting = {
    plate: string,
    display?: string,
    items: PluginSettingItem[]
};

interface PluginManifest {
    main: string;
    name: string;
    component: any,
    introduce: string;
    line_icon: string;
    fill_icon: string;
    settings: PluginSetting;
}

function parseManifest(plugin_manifest: string): PluginManifest {
    const binaryString = atob(plugin_manifest);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    let manifestString: string;
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
    return JSON.parse(manifestString);
}

function isValidManifest(manifest: any): boolean {
    return manifest &&
        typeof manifest.name === 'string' &&
        typeof manifest.introduce === 'string' &&
        typeof manifest.line_icon === 'string' &&
        typeof manifest.fill_icon === 'string';
}

async function pluginLoader(path: string) {
    if (!path) return;

    await new Promise<void>((resolve, reject) => {
        if (window.System) return resolve();
        const script = document.createElement('script');
        script.src = 'lib/system.js';
        script.onload = () => resolve();
        script.onerror = _ => reject(new Error('无法加载 SystemJS 库'));
        document.head.appendChild(script);
    });

    const vuePseudoURL = 'app://vue';
    const wailsRunTimePseudoURL = "app://wailsRunTime";
    const wailsIpcPseudoURL = 'app://wailsIpc';

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
    }

    const wailsIpcWithSubmodules = {
        default: Api,
        ConfigIpc: Config,
        PluginIpc: Plugins,
        ProcessIpc: {},
        UtilsIpc: Utils
    };

    System.set(vuePseudoURL, Vue);
    System.set(wailsRunTimePseudoURL, WailsRunTime);
    System.set(wailsIpcPseudoURL, wailsIpcWithSubmodules);

    const SourceFileResponse: Response = await fetch(path);
    const SourceFile = await SourceFileResponse.json();
    const blob = new Blob([SourceFile], {type: 'application/javascript'});
    const url = URL.createObjectURL(blob);

    try {
        const module = await System.import(url);
        return module.default;
    } finally {
        URL.revokeObjectURL(url);
    }
}

export const usePluginListStore = defineStore('plugin', () => {
    const pluginList = ref<Map<string, PluginManifest>>(new Map());

    let _resolveLoading: (value: void | PromiseLike<void>) => void;
    let _rejectLoading: (reason?: any) => void;
    let isLoadTriggered = false;

    const loadingPromise: Promise<void> = new Promise((resolve, reject) => {
        _resolveLoading = resolve;
        _rejectLoading = reject;
    });

    async function processSinglePlugin(plugin: any): Promise<void> {
        const manifest = parseManifest(plugin.Manifest);

        if (!isValidManifest(manifest)) {
            throw new Error(`清单文件 (manifest) 格式无效`);
        }

        if (pluginList.value.has(manifest.name)) {
            return;
        }

        const pluginPath = `/plugins/${manifest.name}/${manifest.main}`;
        const pluginComponent = defineAsyncComponent(() => pluginLoader(pluginPath));

        const newPluginData = {
            ...manifest,
            component: markRaw(pluginComponent),
            line_icon: manifest.line_icon,
            fill_icon: manifest.fill_icon,
        };

        pluginList.value.set(manifest.name, newPluginData);
    }

    async function Load(): Promise<void> {
        if (isLoadTriggered) {
            return loadingPromise;
        }
        isLoadTriggered = true;

        try {
            const err = await LoadPlugins();
            if (err) throw new Error(`后端初始化插件失败: ${err}`);

            const plugins = await GetPluginList();
            if (!plugins || plugins.length === 0) {
                _resolveLoading();
                return;
            }

            const processingResults = await Promise.allSettled(
                plugins.map(plugin => processSinglePlugin(plugin))
            );

            processingResults.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const pluginName = plugins[index]?.PluginName || '未知插件';
                    console.error(`插件 ${pluginName} 加载失败:`, result.reason);
                    ElNotification({
                        title: '插件加载失败',
                        message: `插件 ${pluginName}: ${result.reason.message}`,
                        type: 'error',
                        position: 'bottom-right'
                    });
                }
            });

            _resolveLoading();
        } catch (error) {
            console.error("插件系统初始化失败:", error);
            ElNotification({
                title: '插件系统错误',
                message: `${error instanceof Error ? error.message : String(error)}`,
                type: 'error',
                position: 'bottom-right'
            });
            _rejectLoading(error);
            throw error;
        }
    }

    return {
        pluginList: toRef(pluginList),
        loadingPromise: readonly(loadingPromise),
        Load,
    };
});