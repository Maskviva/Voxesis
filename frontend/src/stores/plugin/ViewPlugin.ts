import * as Vue from 'vue'
import {type Component, defineAsyncComponent, markRaw} from 'vue'
import * as WailsRunTime from '@wailsio/runtime'
import {Config, Logger, Plugins, Process, Utils} from "../../api";

import {BasePluginManifest} from "./PluginStore";
import * as BirdpaperIcon from "birdpaper-icon";

export type String_PasswordInputSetting = {
    label: string;
    type: "input";
    key: string;
    value_type: "text" | "password";
    value: string;
    placeholder: string;
};

export type NumberInputSetting = {
    label: string;
    type: "input";
    max: number;
    min: number;
    key: string;
    value_type: "number";
    value: number;
    placeholder: string;
};

export type DropDownSetting = {
    label: string;
    type: "drop_down";
    key: string;
    value: string;
    placeholder: string;
    list: {
        label: string;
        value: string | number | boolean;
    }[]
};

export type SwitchSetting = {
    label: string;
    type: "switch";
    key: string;
    value: boolean;
};

export type SelectDirSetting = {
    label: string;
    type: "select_dir";
    key: string;
    value: string;
    title: string;
    filesList: string[][];
    placeholder: string;
};

export type SelectFileSetting = {
    label: string;
    type: "select_file";
    key: string;
    filters: {
        displayName: string;
        pattern: string;
    };
    value: string;
    title: string;
    placeholder: string;
};

export type PluginSettingItem =
    String_PasswordInputSetting
    | NumberInputSetting
    | DropDownSetting
    | SwitchSetting
    | SelectDirSetting
    | SelectFileSetting;

export type PluginSetting = {
    display?: string,
    items: PluginSettingItem[]
};

export type ViewPluginManifest = BasePluginManifest & {
    line_icon: string;
    fill_icon: string;
    settings: PluginSetting;
}

export type ViewPluginObject = ViewPluginManifest & {
    line_icon: Component;
    fill_icon: Component;
    component: Component;
};

declare const System: any;
declare global {
    interface Window {
        System: any;
    }
}

const vuePseudoURL = 'app://vue';
const wailsRunTimePseudoURL = "app://wailsRunTime";
const wailsIpcBaseURL = 'app://wailsIpc/';

const importMap = {
    imports: {
        "vue": vuePseudoURL,
        "WailsRunTime": wailsRunTimePseudoURL,
        "VConfigAPI": wailsIpcBaseURL + "Config",
        "VLoggerAPI": wailsIpcBaseURL + "Logger",
        "VPluginAPI": wailsIpcBaseURL + "Plugin",
        "VProcessAPI": wailsIpcBaseURL + "Process",
        "VUtilsAPI": wailsIpcBaseURL + "Utils"
    }
};

function isPluginSettingItem(item: any): item is PluginSettingItem {
    if (typeof item !== 'object' || item === null) return false;

    // 公共属性检查
    if (typeof item.label !== 'string' ||
        typeof item.key !== 'string') return false;

    switch (item.type) {
        case "input":
            if (item.value_type === "text" || item.value_type === "password") {
                return typeof item.value === 'string' &&
                    typeof item.placeholder === 'string';
            } else if (item.value_type === "number") {
                return typeof item.value === 'number' &&
                    typeof item.min === 'number' &&
                    typeof item.max === 'number' &&
                    typeof item.placeholder === 'string';
            }
            return false;

        case "drop_down":
            return Array.isArray(item.list) &&
                item.list.every((i: any) =>
                    typeof i.label === 'string' &&
                    ['string', 'number', 'boolean'].includes(typeof i.value)
                );

        case "switch":
            return typeof item.value === 'boolean';

        case "select_dir":
        case "select_file":
            return typeof item.value === 'string' &&
                typeof item.placeholder === 'string';

        default:
            return false;
    }
}

function isValidManifest(manifest: ViewPluginManifest): boolean {
    return typeof manifest.line_icon === 'string' &&
        typeof manifest.fill_icon === 'string' &&
        typeof manifest.settings === 'object';
}

function setSystemModels(System: any) {
    System.set(vuePseudoURL, Vue);
    System.set(wailsRunTimePseudoURL, WailsRunTime);
    System.set(wailsIpcBaseURL + "Config", {default: Config});
    System.set(wailsIpcBaseURL + "Logger", {default: Logger});
    System.set(wailsIpcBaseURL + "Plugin", {default: Plugins});
    System.set(wailsIpcBaseURL + "Process", {default: Process});
    System.set(wailsIpcBaseURL + "Utils", {default: Utils});
}

export function validViewPluginManifest(json: BasePluginManifest): ViewPluginManifest {
    if (!isValidManifest(json as ViewPluginManifest)) {
        throw new Error(`${json.name} 的清单文件 (manifest) 格式无效`);
    }

    for (const item of (json as ViewPluginManifest).settings.items) {
        if (!isPluginSettingItem(item)) {
            throw new Error(`${json.name} 的第 ${(json as ViewPluginManifest).settings.items.indexOf(item)} 个 item 无效:`, item);
        }
    }

    return json as ViewPluginManifest;
}

export async function viewPluginLoader(manifest: ViewPluginManifest): Promise<ViewPluginObject> {
    const pluginPath = `/plugins/${manifest.name}/${manifest.main}`;

    await new Promise<void>((resolve, reject) => {
        if (window.System) return resolve();
        const script = document.createElement('script');
        script.src = 'lib/system.js';
        script.onload = () => resolve();
        script.onerror = _ => reject(new Error('无法加载 SystemJS 库'));
        document.head.appendChild(script);
    });

    if (!document.querySelector('script[type="systemjs-importmap"]')) {
        const imScript = document.createElement('script');
        imScript.type = 'systemjs-importmap';
        imScript.textContent = JSON.stringify(importMap);
        document.head.appendChild(imScript);
        System.prepareImport();
    }

    setSystemModels(System)

    const SourceFileResponse: Response = await fetch(pluginPath);
    const SourceFile = await SourceFileResponse.json();
    const blob = new Blob([SourceFile], {type: 'application/javascript'});
    const url = URL.createObjectURL(blob);

    try {
        const _module = await System.import(url);
        const pluginComponent = defineAsyncComponent({
            loader: () => Promise.resolve(_module.default),
        });
        
        return {
            ...manifest,
            line_icon: markRaw((BirdpaperIcon as any)[manifest.line_icon]),
            fill_icon: markRaw((BirdpaperIcon as any)[manifest.fill_icon]),
            component: markRaw(pluginComponent),
        };
    } finally {
        URL.revokeObjectURL(url);
    }
}
