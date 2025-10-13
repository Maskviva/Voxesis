import {type BasePluginManifest} from './PluginStore'

export type ThemePluginManifest = BasePluginManifest & {
    themes: string[];
}

export type ThemePluginObject = {
    name: string;
    themes: string[];
    variables: Map<string, { [key: string]: string; }>;
}

function parseCombinedThemeVariables(cssText: string): ThemePluginObject['variables'] {
    const themes: { [theme: string]: { [key: string]: string } } = {};

    const styleElement = document.createElement('style');
    styleElement.disabled = true;
    styleElement.textContent = cssText;
    document.head.appendChild(styleElement);

    try {
        const sheet = styleElement.sheet;
        if (!sheet) return new Map();

        for (let i = 0; i < sheet.cssRules.length; i++) {
            const rule = sheet.cssRules[i];
            if (!(rule instanceof CSSStyleRule)) continue;

            const selectors = rule.selectorText.split(',').map(s => s.trim());
            const hasRoot = selectors.includes(':root');
            const themeNames: string[] = [];

            for (const selector of selectors) {
                const match = selector.match(/^\[data-theme="([^"]+)"\]$/);
                if (match) {
                    themeNames.push(match[1]);
                }
            }

            if (!hasRoot || themeNames.length === 0) continue;

            for (let j = 0; j < rule.style.length; j++) {
                const propName = rule.style[j];

                if (!propName.startsWith('--')) continue;

                const propValue = rule.style.getPropertyValue(propName).trim();
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

    return new Map(Object.entries(themes));
}

export function validThemePluginManifest(json: BasePluginManifest): ThemePluginManifest {
    if (!json || typeof json !== 'object') {
        throw new Error('清单文件 (manifest) 必须是一个对象');
    }
    if (!Array.isArray((json as ThemePluginManifest).themes)) {
        throw new Error('清单文件 (manifest) 中的 "themes" 必须是一个数组');
    }
    if (!(json as ThemePluginManifest).themes.every(theme => typeof theme === 'string')) {
        throw new Error('清单文件 (manifest) "themes" 数组中的所有元素都必须是字符串');
    }
    return json as ThemePluginManifest;
}

export async function themePluginLoader(manifest: ThemePluginManifest): Promise<ThemePluginObject> {
    const pluginPath = `/plugins/${manifest.name}/${manifest.main}`;
    const res = await fetch(pluginPath);
    if (!res.ok) {
        throw new Error(`无法加载主题插件 ${manifest.name} 的源文件: ${res.statusText}`);
    }
    const cssText = await res.text();

    const rootVars = parseCombinedThemeVariables(cssText);

    return {
        name: manifest.name,
        themes: manifest.themes,
        variables: rootVars
    };
}