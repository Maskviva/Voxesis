import {defineStore} from "pinia";
import {AppConfig} from "../../instance/AppConfig";
import {readonly, ref, Ref} from "vue";

/**
 * 应用配置储存
 */
export const useAppConfigStore = defineStore('appConfig', () => {
    const appConfig: Ref<AppConfig> = ref();

    /**
     * 加载应用配置类
     * @constructor
     */
    async function Load() {
        appConfig.value = new AppConfig();
        await appConfig.value.Create();
    }

    return {
        appConfig: readonly(appConfig),
        Load
    }
});