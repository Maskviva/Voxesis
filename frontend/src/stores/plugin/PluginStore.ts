import {readonly, ref, toRef} from "vue";
import {defineStore} from "pinia";
import {ElNotification} from "element-plus";
import {GetPluginList, LoadPlugins} from "../../api/plugins";
import {validViewPluginManifest, viewPluginLoader, ViewPluginManifest, ViewPluginObject} from "./ViewPlugin";
import {themePluginLoader, ThemePluginManifest, ThemePluginObject, validThemePluginManifest} from "./ThemePlugin";

import {useViewStore} from "../core/ViewStore";
import {useThemeStore} from "../core/ThemeStore";

// 插件对象配置文件基类
export interface BasePluginManifest {
    name: string;
    main: string;
    introduce: string;
    plugin_type: 'view' | 'theme';
    version: string;
    author: string;
    repository?: string;
}

// 视图插件对象
export type ViewPluginItem = {
    name: string;
    enable: boolean;
    type: 'view';
    Object: ViewPluginObject;
}

// 主题插件对象
export type ThemePluginItem = {
    name: string;
    enable: boolean;
    type: 'theme';
    Object: ThemePluginObject;
}

// 插件对象联合类型
export type PluginItem = ViewPluginItem | ThemePluginItem;

/**
 * 对后端的插件配置文件进行解析
 * @param plugin_manifest 来自后端的Base64编码的清单文件字符串
 */
function parseManifest(plugin_manifest: string): BasePluginManifest {
    // 解码Base64字符串
    const binaryString = atob(plugin_manifest);
    // 转换为字节数组
    const bytes = new Uint8Array(binaryString.length);

    // 填充字节数组
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    let manifestString: string;
    try {
        // 优先尝试使用UTF-8解码
        manifestString = new TextDecoder('utf-8').decode(bytes);
        JSON.parse(manifestString);
    } catch (utf8Error) {
        try {
            // 如果UTF-8失败，尝试使用GBK解码以兼容旧版或特定环境
            manifestString = new TextDecoder('gbk').decode(bytes);
            JSON.parse(manifestString);
        } catch (gbkError) {
            // 如果两种解码都失败，则使用原始二进制字符串（可能导致后续解析失败）
            manifestString = binaryString;
        }
    }

    // 返回解析后的JSON对象
    return JSON.parse(manifestString);
}

/**
 * 对插件配置文件基础信息进行非空值效验
 * @param manifest 解析后的清单文件对象
 */
function isValidManifest(manifest: any): boolean {
    return manifest &&
        typeof manifest.name === 'string' &&
        typeof manifest.main === 'string' &&
        typeof manifest.introduce === 'string' &&
        typeof manifest.plugin_type === 'string' &&
        typeof manifest.version === 'string' &&
        typeof manifest.author === 'string'
}

// 插件管理储存
export const usePluginListStore = defineStore('plugin', () => {
    const pluginList = ref<Map<string, PluginItem>>(new Map()); // 存储所有已加载插件的列表
    const themePluginList = ref<Map<string, ThemePluginItem>>(new Map()); // 专门存储主题插件的列表
    const viewPluginList = ref<Map<string, ViewPluginItem>>(new Map()); // 专门存储视图插件的列表

    // 引入其他Pinia store
    const viewStore = useViewStore();
    const themeStore = useThemeStore();

    let _resolveLoading: (value: void | PromiseLike<void>) => void; // 用于标识插件加载完成的Promise的resolve函数
    let isLoadTriggered = false; // 标记Load函数是否已被调用，防止重复执行
    // 创建一个Promise，用于在插件加载完成后通知其他部分
    const loadingPromise: Promise<void> = new Promise((resolve) => {
        _resolveLoading = resolve;
    });

    /**
     * 处理单个插件的加载和注册流程
     * @param plugin 从后端获取的单个插件信息
     */
    async function processSinglePlugin(plugin: any): Promise<void> {
        // 解析插件清单文件
        const manifest: BasePluginManifest = parseManifest(plugin.Manifest);

        // 验证清单文件基本格式的有效性
        if (!isValidManifest(manifest)) throw new Error(`清单文件 (manifest) 格式无效`);
        // 检查插件是否已存在，防止重复加载
        if (pluginList.value.has(manifest.name)) throw new Error(`重复的插件: ${manifest.name}`);

        let newPluginItem: PluginItem;

        // 根据插件类型进行不同的处理
        switch (manifest.plugin_type) {
            // 处理视图插件
            case 'view': {
                // 验证视图插件清单文件的特定字段
                const viewManifest: ViewPluginManifest = validViewPluginManifest(manifest);
                // 加载视图插件模块
                const viewPluginObject: ViewPluginObject = await viewPluginLoader(viewManifest);

                // 创建标准化的视图插件项
                const viewPluginItem: ViewPluginItem = {
                    name: manifest.name, type: 'view',
                    enable: true,
                    Object: viewPluginObject
                };

                // 在视图插件列表中注册
                viewPluginList.value.set(manifest.name, viewPluginItem);
                // 将插件提供的视图添加到视图仓库中
                await viewStore.AddView(viewPluginItem);

                newPluginItem = viewPluginItem;
                break;
            }
            // 处理主题插件
            case 'theme': {
                // 验证主题插件清单文件的特定字段
                const themeManifest: ThemePluginManifest = validThemePluginManifest(manifest);
                // 加载主题插件资源
                const themePluginObject: ThemePluginObject = await themePluginLoader(themeManifest);

                // 创建标准化的主题插件项
                const themePluginItem: ThemePluginItem = {
                    name: manifest.name, type: 'theme',
                    enable: true,
                    Object: themePluginObject
                };

                // 在主题插件列表中注册
                themePluginList.value.set(manifest.name, themePluginItem);
                // 将插件提供的主题添加到主题仓库中
                await themeStore.AddThemesFromPlugin(themePluginObject);

                newPluginItem = themePluginItem;
                break;
            }
            default:
                // 如果插件类型未知，则抛出错误
                throw new Error(`来自插件 ${manifest.name} 的未知插件类型: ${manifest.plugin_type}`);
        }

        // 将处理完成的插件添加到主插件列表中
        pluginList.value.set(manifest.name, newPluginItem);
    }

    /**
     * 初始化插件系统，加载所有插件
     */
    async function Load(): Promise<void> {
        // 防止重复初始化
        if (isLoadTriggered) return loadingPromise;
        isLoadTriggered = true;

        try {
            // 调用API，初始化后端插件系统
            const err = await LoadPlugins();
            if (err) throw new Error(err);

            // 调用API，获取所有插件的列表
            const plugins = await GetPluginList();

            // 如果没有插件，直接完成加载
            if (!plugins || plugins.length === 0) {
                _resolveLoading();
                return;
            }

            // 使用Promise.allSettled并发处理所有插件，以提高加载效率并确保即使部分插件失败，其他插件也能继续加载
            const processingResults = await Promise.allSettled(
                plugins.map(plugin => processSinglePlugin(plugin))
            );

            // 遍历处理结果，对加载失败的插件进行通知
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

            // 所有插件处理完毕，通知加载完成
            _resolveLoading();
        } catch (error) {
            console.error("插件系统初始化失败:", error);
            ElNotification({
                title: '插件系统错误',
                message: `${error instanceof Error ? error.message : String(error)}`,
                type: 'error',
                position: 'bottom-right'
            });
            // 向上抛出错误，以便其他部分可以捕获
            throw error;
        }
    }

    async function SetEnable(pluginName: string, enable: boolean): Promise<void> {
        pluginList.value.get(pluginName).enable = enable
    }

    return {
        pluginList: toRef(readonly(pluginList)),
        themePluginList: toRef(readonly(themePluginList)),
        viewPluginList: toRef(readonly(viewPluginList)),
        loadingPromise: readonly(loadingPromise),
        Load,
        SetEnable,
    };
});