import {defineStore} from "pinia";
import {readonly, ref, Ref, toRef} from "vue";
import {ThemePluginObject} from "../plugin/ThemePlugin";

export type Theme = {
    name: string;
    type: 'custom' | 'default';
    variables: { [key: string]: string }[];
}

const DefaultThemes: Theme[] = [
    {name: 'light', type: 'default', variables: []},
    {name: 'dark', type: 'default', variables: []},
    {name: 'frosted-glass', type: 'default', variables: []},
]

export const useThemeStore = defineStore('theme', () => {
    const Themes: Ref<Map<string, Theme>> = ref(new Map<string, Theme>())
    const currentCustomThemeVars: Ref<string[]> = ref([]);

    async function Load(appConfigStore: any) {
        DefaultThemes.forEach(theme => AddTheme(theme));
        const defaultTheme = await appConfigStore.appConfig.GetValueOfKey('theme');
        await ToggleTheme(defaultTheme);
    }

    async function AddTheme(theme: Theme) {
        Themes.value.set(theme.name, theme);
    }

    function AddThemesFromPlugin(pluginObject: ThemePluginObject) {
        for (const [themeName, variables] of pluginObject.variables.entries()) {
            if (!pluginObject.themes.includes(themeName)) continue;

            AddTheme({
                name: themeName,
                type: 'custom',
                variables: [variables],
            });
        }
    }

    async function ToggleTheme(themeName: string): Promise<void> {
        if (!Themes.value.has(themeName)) {
            console.error(`切换失败，找不到主题: ${themeName}`);
            return;
        }
        const theme = Themes.value.get(themeName)!;

        currentCustomThemeVars.value.forEach(varName => {
            document.documentElement.style.removeProperty(varName);
        });
        currentCustomThemeVars.value = [];

        if (theme.type === 'default') {
            document.documentElement.setAttribute('data-theme', themeName);
        } else {
            const newVars: string[] = [];
            theme.variables.forEach(variableSet => {
                for (const key in variableSet) {
                    document.documentElement.style.setProperty(key, variableSet[key]);
                    newVars.push(key);
                }
            });
            currentCustomThemeVars.value = newVars;
        }
    }

    return {
        Themes: toRef(readonly(Themes)),
        Load,
        AddTheme,
        AddThemesFromPlugin,
        ToggleTheme
    }
})