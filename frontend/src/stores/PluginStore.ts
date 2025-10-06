import * as Vue from "vue";
import {defineAsyncComponent, markRaw, readonly, Ref, ref, toRef} from "vue";
import {defineStore} from "pinia";
import {GetPluginList, LoadPlugins} from "../../bindings/voxesis/src/Communication/InterProcess/pluginipc";

import {ElNotification} from "element-plus";
import * as BirdpaperIcon from 'birdpaper-icon'
import * as bindIngs from '../../bindings/voxesis/src/Communication/InterProcess'
import * as WailsRunTime from '@wailsio/runtime'

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

interface PluginManifest {
    main: string;
    name: string;
    component: any,
    introduce: string;
    line_icon: any;
    fill_icon: any;
    settings: PluginSetting;
}

export const usePluginListStore = defineStore('plugin', () => {
    const PluginList = ref<Map<string, PluginManifest>>(new Map())

    async function Load() {
        const err = await LoadPlugins()

        if (err) {
            console.error(err)
        }

        const plugins = await GetPluginList()

        if (!plugins) return

        for (const plugin of plugins) {
            // 解析JSON
            const manifest: PluginManifest = parse_manifest(plugin.Manifest);

            if (isValidManifest(manifest)) {
                const pluginPath = `/plugins/${manifest.name}/${manifest.main}`;
                const pluginComponent = defineAsyncComponent(() => PluginLoader(pluginPath) as any)

                const PluginView = {
                    name: manifest.name,
                    main: manifest.main,
                    component: markRaw(pluginComponent),
                    introduce: manifest.introduce,
                    line_icon: markRaw((BirdpaperIcon as any)[manifest.line_icon]),
                    fill_icon: markRaw((BirdpaperIcon as any)[manifest.fill_icon]),
                    settings: manifest.settings
                }

                PluginList.value.set(manifest.name, PluginView)
            } else {
                ElNotification({
                    title: '插件加载器',
                    message: `插件 ${plugin.PluginName ?? manifest} 加载失败`,
                    type: 'error',
                    position: 'bottom-right'
                })
            }
        }
    }

    function parse_manifest(plugin_manifest: string): PluginManifest {
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

        // 解析JSON
        return JSON.parse(manifestString);
    }

    function isValidManifest(manifest: any): boolean {
        return manifest &&
            typeof manifest.name === 'string' &&
            typeof manifest.introduce === 'string' &&
            typeof manifest.line_icon === 'string' &&
            typeof manifest.fill_icon === 'string';
    }

    async function PluginLoader(path: string) {
        if (!path) return

        await new Promise<void>((resolve, reject) => {
            if (window.System) return resolve();
            const script = document.createElement('script');
            script.src = 'src/assets/lib/system.js';
            script.onload = () => resolve();
            script.onerror = _ => reject(new Error('无法加载 SystemJS 库'));
            document.head.appendChild(script);
        });

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
            PluginIpc: bindIngs.PluginIpc,
            ProcessIpc: bindIngs.ProcessIpc,
            UtilsIpc: bindIngs.UtilsIpc
        };

        System.set(vuePseudoURL, Vue);
        System.set(wailsRunTimePseudoURL, WailsRunTime)
        System.set(wailsIpcPseudoURL, wailsIpcWithSubmodules);

        const SourceFileResponse: Response = await fetch(path)
        const SourceFile = await SourceFileResponse.json()
        const blob = new Blob([SourceFile], {type: 'application/javascript'});
        const url = URL.createObjectURL(blob);

        const module = await System.import(url);

        URL.revokeObjectURL(url);

        return module.default;
    }

    return {
        pluginList: readonly(toRef(PluginList)),
        Load,
    }
})