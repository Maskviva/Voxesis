import {defineStore} from "pinia";
import {AppConfig} from "../instance/AppConfig";
import {readonly, ref, Ref} from "vue";

export const useAppConfigStore = defineStore('appConfig', () => {
    const appConfig: Ref<AppConfig> = ref();

    async function Load() {
        appConfig.value = new AppConfig();
        await appConfig.value.Create();
    }

    return {
        appConfig: readonly(appConfig),
        Load
    }
});