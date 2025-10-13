import {defineStore} from "pinia";
import {readonly, ref, Ref, toRef} from "vue";

export type Theme = {
    name: string;
    type: 'custom' | 'default';
    variables: { [key: string]: string }[];
}

const DefaultThemes: Theme[] = [
    {
        name: 'light',
        type: 'default',
        variables: []
    },
    {
        name: 'dark',
        type: 'default',
        variables: []
    },
    {
        name: 'frosted-glass',
        type: 'default',
        variables: []
    },
]

export const useThemeStore = defineStore('theme', () => {
    const Themes: Ref<Map<string, Theme>> = ref(new Map<string, Theme>())
    const currentCustomThemeVars: Ref<string[]> = ref([]);

    async function Load(appConfigStore: any) {
        DefaultThemes.forEach(theme => AddTheme(theme))

        const defaultTheme = await appConfigStore.appConfig.GetValueOfKey('theme')

        await ToggleTheme(defaultTheme)
    }

    async function AddTheme(theme: Theme) {
        Themes.value.set(theme.name, theme)
    }

    async function ToggleTheme(themeName: string): Promise<void> {
        if (!Themes.value.has(themeName)) throw new Error(`找不到主题: ${themeName} `);
        const theme = Themes.value.get(themeName)

        currentCustomThemeVars.value.forEach(varName => {
            document.documentElement.style.setProperty(varName, '');
        });
        currentCustomThemeVars.value = [];

        if (theme.type === 'default') {
            document.documentElement.setAttribute('data-theme', themeName);
        } else {
            theme.variables.forEach(variable => {
                Object.keys(variable).forEach(key => {
                    document.documentElement.style.setProperty(key, variable[key]);
                    currentCustomThemeVars.value.push(key);
                })
            });
        }
    }

    return {
        Themes: toRef(readonly(Themes)),
        Load,
        AddTheme,
        ToggleTheme
    }
})