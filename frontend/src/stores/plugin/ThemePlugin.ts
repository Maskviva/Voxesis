import {type BasePluginManifest} from './PluginStore'

/**
 * 主题插件的清单文件类型定义，扩展了基础清单类型
 */
export type ThemePluginManifest = BasePluginManifest & {
    // 定义了插件包含的主题列表，每个主题有名称和唯一标识
    themes: { name: string; theme: string; }[];
}

/**
 * 加载后的主题插件对象类型定义
 */
export type ThemePluginObject = ThemePluginManifest & {
    name: string;
    themes: { name: string; theme: string; }[];
    variables: Map<string, { [key: string]: string; }>;
}

/**
 * 解析主题插件的 CSS 文件内容，提取所有主题的CSS自定义变量
 * @param cssText 从插件CSS文件中读取的文本内容
 * @returns 返回一个Map，键是主题名称，值是该主题下的所有CSS变量键值对
 */
function parseCombinedThemeVariables(cssText: string): ThemePluginObject['variables'] {
    // 临时存储解析出的主题变量
    const themes: { [theme: string]: { [key: string]: string } } = {};

    // 创建一个临时的<style>元素来利用浏览器自身的CSS解析器
    const styleElement = document.createElement('style');
    styleElement.disabled = true; // 禁用样式，防止其影响当前页面
    styleElement.textContent = cssText; // 将CSS文本内容放入style元素
    document.head.appendChild(styleElement); // 将style元素添加到文档头部

    try {
        // 获取浏览器解析后的样式表（CSSStyleSheet）
        const sheet = styleElement.sheet;
        if (!sheet) return new Map();

        // 遍历样式表中的所有CSS规则
        for (let i = 0; i < sheet.cssRules.length; i++) {
            const rule = sheet.cssRules[i];
            // 只处理样式规则（CSSStyleRule），忽略@import等其他规则
            if (!(rule instanceof CSSStyleRule)) continue;

            // 获取规则的选择器文本，并按逗号分割成数组
            const selectors = rule.selectorText.split(',').map(s => s.trim());
            const hasRoot = selectors.includes(':root'); // 检查是否包含:root选择器
            const themeNames: string[] = [];

            // 从选择器中提取主题名称，例如 `[data-theme="dark"]`
            for (const selector of selectors) {
                const match = selector.match(/^\[data-theme="([^"]+)"]$/);
                if (match) {
                    themeNames.push(match[1]);
                }
            }

            // 如果规则不适用于:root或没有指定主题，则跳过
            if (!hasRoot || themeNames.length === 0) continue;

            // 遍历规则中的所有样式属性
            for (let j = 0; j < rule.style.length; j++) {
                const propName = rule.style[j];
                // 只关心CSS自定义属性（变量）
                if (!propName.startsWith('--')) continue;

                const propValue = rule.style.getPropertyValue(propName).trim();
                // 将变量及其值存入对应的主题中
                for (const themeName of themeNames) {
                    if (!themes[themeName]) {
                        themes[themeName] = {};
                    }
                    themes[themeName][propName] = propValue;
                }
            }
        }
    } finally {
        // 无论成功与否，最后都从DOM中移除这个临时style元素
        document.head.removeChild(styleElement);
    }

    // 将普通对象转换为Map并返回
    return new Map(Object.entries(themes));
}

/**
 * 验证主题插件的清单文件（manifest）是否符合要求
 * @param json 解析后的清单文件JSON对象
 * @returns 返回强类型的主题插件清单对象，如果验证失败则抛出错误
 */
export function validThemePluginManifest(json: BasePluginManifest): ThemePluginManifest {
    if (!json || typeof json !== 'object') {
        throw new Error('清单文件 (manifest) 必须是一个对象');
    }
    // 验证 "themes" 字段是否存在且为数组
    if (!Array.isArray((json as ThemePluginManifest).themes)) {
        throw new Error('清单文件 (manifest) 中的 "themes" 必须是一个数组');
    }
    // 可以在此添加更详细的验证，例如检查数组中每个元素的格式
    // if (!(json as ThemePluginManifest).themes.every(theme => typeof theme === 'string')) {
    //     throw new Error('清单文件 (manifest) "themes" 数组中的所有元素都必须是字符串');
    // }
    return json as ThemePluginManifest;
}

/**
 * 异步加载单个主题插件
 * @param manifest 经过验证的主题插件清单文件
 * @returns 返回一个包含插件信息和解析后CSS变量的Promise
 */
export async function themePluginLoader(manifest: ThemePluginManifest): Promise<ThemePluginObject> {
    // 构建插件主CSS文件的路径
    const pluginPath = `/plugins/${manifest.name}/${manifest.main}`;
    // 使用fetch API获取CSS文件内容
    const res = await fetch(pluginPath);

    // 如果请求失败，则抛出错误
    if (!res.ok) {
        throw new Error(`无法加载主题插件 ${manifest.name} 的源文件: ${res.statusText}`);
    }
    // 获取响应的文本内容
    const cssText = await res.text();

    // 解析CSS文本内容以提取CSS变量
    const rootVars = parseCombinedThemeVariables(cssText);

    // 构建并返回主题插件对象
    return {
        ...manifest,
        name: manifest.name,
        themes: manifest.themes,
        variables: rootVars
    };
}