import {readonly, ref, toRef} from "vue";
import {defineStore} from "pinia";
import {ElNotification} from "element-plus";
import {GetPluginList, LoadPlugins} from "../../api/plugins";
import {validViewPluginManifest, viewPluginLoader, ViewPluginManifest, ViewPluginObject} from "./ViewPlugin";

export interface BasePluginManifest {
    name: string;
    main: string;
    introduce: string;
    plugin_type: 'view' | 'theme';
    version: string;
    author: string;
    repository?: string;
}

export type PluginItem = {
    name: string;
    enable: boolean;
    type: 'view' | 'theme';
    Object: ViewPluginObject
}

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

    let _resolveLoading: (value: void | PromiseLike<void>) => void;
    let _rejectLoading: (reason?: any) => void;
    let isLoadTriggered = false;

    const loadingPromise: Promise<void> = new Promise((resolve, reject) => {
        _resolveLoading = resolve;
        _rejectLoading = reject;
    });

    async function processSinglePlugin(plugin: any): Promise<void> {
        const manifest: BasePluginManifest = parseManifest(plugin.Manifest);

        if (!isValidManifest(manifest)) {
            throw new Error(`清单文件 (manifest) 格式无效`);
        }

        if (pluginList.value.has(manifest.name)) {
            throw new Error(`重复的插件: ${manifest.name}`);
        }

        switch (manifest.plugin_type) {
            case 'view':
                const viewManifest: ViewPluginManifest = validViewPluginManifest(manifest);
                const viewPluginObject: ViewPluginObject = await viewPluginLoader(viewManifest)

                pluginList.value.set(manifest.name, {
                    name: manifest.name,
                    type: manifest.plugin_type,
                    enable: true,
                    Object: viewPluginObject
                });
                break;
            case 'theme':

                break;
            default:
                throw new Error(`来自插件 ${manifest.plugin_type} 的未知插件类型: ${manifest.plugin_type}`);
        }
    }

    async function Load(): Promise<void> {
        if (isLoadTriggered) {
            return loadingPromise;
        }
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