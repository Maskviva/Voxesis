import {type BasePluginManifest} from './PluginStore'

export type ThemePluginManifest = BasePluginManifest & {
    themes: string[];
}

export type ThemePluginObject = {
    name: string;
    themes: string[];
    variables: {
        theme: string;
        value: {
            [key: string]: string;
        };
    }[];
}

function parseCombinedThemeVariables(cssText: string): ThemePluginObject['variables'] {
    const themes: { [theme: string]: { [key: string]: string } } = {};

    const styleElement = document.createElement('style');
    styleElement.disabled = true;
    styleElement.textContent = cssText;
    document.head.appendChild(styleElement);

    try {
        const sheet = styleElement.sheet;
        if (!sheet) return [];

        for (let i = 0; i < sheet.cssRules.length; i++) {
            const rule = sheet.cssRules[i];
            if (!(rule instanceof CSSStyleRule)) continue;

            const selectors = rule.selectorText.split(',').map(s => s.trim());

            const hasRoot = selectors.includes(':root');

            // 找出所有 data-theme 选择器，并提取主题名
            const themeNames: string[] = [];
            for (const selector of selectors) {
                const match = selector.match(/^\[data-theme="([^"]+)"\]$/);
                if (match) {
                    themeNames.push(match[1]);
                }
            }

            // 只有当规则同时包含 :root 和至少一个 [data-theme] 时才处理
            if (!hasRoot || themeNames.length === 0) continue;

            for (let i = 0; i < rule.style.length; i++) {
                const propName = rule.style[i];
                if (!propName.startsWith('--')) return;

                const propValue = rule.style.getPropertyValue(propName).trim();

                // 将这个变量添加到这个规则块里找到的所有主题中
                for (const themeName of themeNames) {
                    if (!themes[themeName]) {
                        themes[themeName] = {};
                    }
                    themes[themeName][propName] = propValue;

                }
            }
        }
    } finally {
        document.head.removeChild(styleElement);
    }

    // 将结果转换为您需要的数组格式
    return Object.entries(themes).map(([theme, value]) => ({
        theme,
        value
    }));
}

export function validThemePluginManifest(json: BasePluginManifest): ThemePluginManifest {
    if (!json || typeof json !== 'object') return null;

    if (!Array.isArray((json as ThemePluginManifest).themes)) return null;

    if (!(json as ThemePluginManifest).themes.every(theme => typeof theme === 'string')) return null;

    return json as ThemePluginManifest;
}

export async function themePluginLoader(manifest: ThemePluginManifest): Promise<ThemePluginObject> {
    const pluginPath = `/plugins/${manifest.name}/${manifest.main}`;
    const res = await fetch(pluginPath);
    if (!res.ok) return;
    const cssText = await res.text();

    const rootVars = parseCombinedThemeVariables(cssText);

    return {
        name: manifest.name,
        themes: manifest.themes,
        variables: rootVars
    };
}
