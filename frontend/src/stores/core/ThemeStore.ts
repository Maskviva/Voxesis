import {defineStore} from "pinia";
import {readonly, ref, Ref, toRef} from "vue";
import {ThemePluginObject} from "../plugin/ThemePlugin";

/**
 * 主题对象的类型定义
 */
export type Theme = {
    name: string;
    theme: string;
    type: 'custom' | 'default';
    variables: { [key: string]: string }[];
}

// 定义内置的默认主题
const DefaultThemes: Theme[] = [
    {name: '明亮', theme: 'light', type: 'default', variables: []},
    {name: '暗黑', theme: 'dark', type: 'default', variables: []},
    {name: '磨砂玻璃', theme: 'frosted-glass', type: 'default', variables: []},
]

/**
 * 主题管理储存
 */
export const useThemeStore = defineStore('theme', () => {
    // 使用Map存储所有可用主题，以主题标识符(theme)为键
    const Themes: Ref<Map<string, Theme>> = ref(new Map<string, Theme>())
    // 标记初始化流程是否完成
    const InitSuccess: Ref<boolean> = ref(false);
    // 用于缓存在Store初始化完成前，由插件添加的主题
    const CacheDelayThemes: Ref<Theme[]> = ref([]);
    // 当前主题名称
    const CurrentTheme: Ref<string> = ref('');
    // 存储当前应用的自定义主题所设置的CSS变量名，方便切换时移除
    const currentCustomThemeVars: Ref<string[]> = ref([]);

    /**
     * 加载并初始化主题逻辑
     * @param appConfigStore 应用配置Store的实例，用于读取用户保存的主题设置
     */
    async function Load(appConfigStore: any) {
        // 首先加载所有内置的默认主题
        DefaultThemes.forEach(theme => AddTheme(theme));

        // 从配置中读取用户上次选择的主题并应用
        const defaultTheme = await appConfigStore.appConfig.GetValueOfKey('theme');
        const err = await ToggleTheme(defaultTheme);

        // 如果配置的主题不存在，则回退到默认的 light 主题
        if (err && err.includes("找不到主题")) await ToggleTheme('light');

        // 处理在初始化期间缓存的来自插件的主题
        for (const theme of CacheDelayThemes.value) {
            await AddTheme(theme);
        }

        // 标记初始化成功
        InitSuccess.value = true;
    }

    /**
     * 向主题列表中添加一个新主题
     * @param theme 要添加的主题对象
     */
    async function AddTheme(theme: Theme) {
        // 使用主题的唯一标识符作为键存入Map
        Themes.value.set(theme.theme, theme);
    }

    /**
     * 从已加载的主题插件对象中提取并添加主题
     * @param pluginObject 主题插件加载后生成的对象
     */
    async function AddThemesFromPlugin(pluginObject: ThemePluginObject) {
        // 遍历插件解析出的所有CSS变量组（每个变量组对应一个主题）
        for (const [themeName, variables] of pluginObject.variables.entries()) {
            // 确保该主题在插件的manifest中有定义
            if (!pluginObject.themes.map(t => t.theme).includes(themeName)) continue;

            // 构建标准的主题对象
            const theme: Theme = {
                name: pluginObject.themes.find(t => t.theme === themeName)!.name,
                theme: themeName,
                type: 'custom',
                variables: [variables],
            }

            // 如果Store尚未初始化完成，则将主题暂存到缓存队列
            if (!InitSuccess.value) {
                CacheDelayThemes.value.push(theme);
            } else {
                // 如果已初始化，则直接添加
                await AddTheme(theme);
            }
        }
    }

    /**
     * 切换当前应用的主题
     * @param themeName 要切换到的主题的唯一标识符
     * @returns 如果切换失败则返回错误信息字符串，成功则返回null
     */
    async function ToggleTheme(themeName: string): Promise<string | null> {
        // 检查目标主题是否存在
        if (!Themes.value.has(themeName)) return `切换失败，找不到主题: ${themeName}`;

        const theme = Themes.value.get(themeName)!;

        // 在切换前，先移除上一个自定义主题设置的所有CSS变量
        currentCustomThemeVars.value.forEach(varName => {
            document.documentElement.style.removeProperty(varName);
        });
        // 清空当前自定义变量列表
        currentCustomThemeVars.value = [];

        if (theme.type === 'default') {
            // 对于默认主题，通过设置<html>元素的`data-theme`属性来切换，依赖预定义的CSS
            document.documentElement.setAttribute('data-theme', themeName);
        } else {
            // 对于自定义主题，需要通过JavaScript动态设置CSS变量
            const newVars: string[] = [];
            // 遍历主题的所有变量集
            theme.variables.forEach(variableSet => {
                // 遍历变量集中的每个变量
                for (const key in variableSet) {
                    // 将CSS变量设置到<html>元素的style上
                    document.documentElement.style.setProperty(key, variableSet[key]);
                    newVars.push(key);
                }
            });
            // 更新当前应用的自定义变量列表，以便下次切换时可以清除
            currentCustomThemeVars.value = newVars;
            CurrentTheme.value = themeName;
        }

        return null;
    }

    return {
        Themes: toRef(readonly(Themes)),
        CurrentTheme: toRef(readonly(CurrentTheme)),
        Load,
        AddTheme,
        AddThemesFromPlugin,
        ToggleTheme
    }
})