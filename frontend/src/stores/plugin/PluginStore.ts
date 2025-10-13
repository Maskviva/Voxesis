import {readonly, ref, toRef} from "vue";
import {defineStore} from "pinia";
import {ElNotification} from "element-plus";
import {GetPluginList, LoadPlugins} from "../../api/plugins";
import {validViewPluginManifest, viewPluginLoader, ViewPluginManifest, ViewPluginObject} from "./ViewPlugin";
import {themePluginLoader, ThemePluginManifest, ThemePluginObject, validThemePluginManifest} from "./ThemePlugin";

import {useViewStore} from "../core/ViewStore";
import {useThemeStore} from "../core/ThemeStore";

export interface BasePluginManifest {
    name: string;
    main: string;
    introduce: string;
    plugin_type: 'view' | 'theme';
    version: string;
    author: string;
    repository?: string;
}

export type ViewPluginItem = {
    name: string;
    enable: boolean;
    type: 'view';
    Object: ViewPluginObject;
}

export type ThemePluginItem = {
    name: string;
    enable: boolean;
    type: 'theme';
    Object: ThemePluginObject;
}

export type PluginItem = ViewPluginItem | ThemePluginItem;


function parseManifest(plugin_manifest: string): BasePluginManifest {
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
        typeof manifest.main === 'string' &&
        typeof manifest.introduce === 'string' &&
        typeof manifest.plugin_type === 'string' &&
        typeof manifest.version === 'string' &&
        typeof manifest.author === 'string'
}

export const usePluginListStore = defineStore('plugin', () => {
    const pluginList = ref<Map<string, PluginItem>>(new Map());
    const themePluginList = ref<Map<string, ThemePluginItem>>(new Map());
    const viewPluginList = ref<Map<string, ViewPluginItem>>(new Map());

    const viewStore = useViewStore();
    const themeStore = useThemeStore();

    let _resolveLoading: (value: void | PromiseLike<void>) => void;
    let isLoadTriggered = false;
    const loadingPromise: Promise<void> = new Promise((resolve) => {
        _resolveLoading = resolve;
    });

    async function processSinglePlugin(plugin: any): Promise<void> {
        const manifest: BasePluginManifest = parseManifest(plugin.Manifest);

        if (!isValidManifest(manifest)) throw new Error(`清单文件 (manifest) 格式无效`);
        if (pluginList.value.has(manifest.name)) throw new Error(`重复的插件: ${manifest.name}`);

        let newPluginItem: PluginItem;

        switch (manifest.plugin_type) {
            case 'view': {
                const viewManifest: ViewPluginManifest = validViewPluginManifest(manifest);
                const viewPluginObject: ViewPluginObject = await viewPluginLoader(viewManifest);

                const viewPluginItem: ViewPluginItem = {
                    name: manifest.name, type: 'view',
                    enable: true,
                    Object: viewPluginObject
                };

                viewPluginList.value.set(manifest.name, viewPluginItem);

                viewStore.AddView(viewPluginItem);

                newPluginItem = viewPluginItem;
                break;
            }
            case 'theme': {
                const themeManifest: ThemePluginManifest = validThemePluginManifest(manifest);
                const themePluginObject: ThemePluginObject = await themePluginLoader(themeManifest);

                const themePluginItem: ThemePluginItem = {
                    name: manifest.name, type: 'theme',
                    enable: true,
                    Object: themePluginObject
                };

                themePluginList.value.set(manifest.name, themePluginItem);

                themeStore.AddThemesFromPlugin(themePluginObject);

                newPluginItem = themePluginItem;
                break;
            }
            default:
                throw new Error(`来自插件 ${manifest.name} 的未知插件类型: ${manifest.plugin_type}`);
        }

        pluginList.value.set(manifest.name, newPluginItem);
    }

    async function Load(): Promise<void> {
        if (isLoadTriggered) return loadingPromise;
        isLoadTriggered = true;

        try {
            const err = await LoadPlugins();
            if (err) throw new Error(err);

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
            throw error;
        }
    }

    return {
        pluginList: toRef(readonly(pluginList)),
        themePluginList: toRef(readonly(themePluginList)),
        viewPluginList: toRef(readonly(viewPluginList)),
        loadingPromise: readonly(loadingPromise),
        Load,
    };
});