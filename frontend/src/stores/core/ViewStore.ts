import {defineStore} from "pinia";
import {markRaw, Ref, ref, toRef} from "vue";
import InstanceView from "../../view/Instance.vue";
import {IconArchive2Fill, IconArchive2Line, IconDatabaseFill, IconDatabaseLine} from "birdpaper-icon";
import PluginManagerView from "../../view/PluginManager.vue";
import {ViewPluginItem} from "../plugin/PluginStore";
import {ViewPluginObject} from "../plugin/ViewPlugin";


const defaultViews: ViewPluginItem[] = [
    {
        name: 'instance',
        type: 'view',
        enable: true,
        Object: {
            name: 'instance',
            component: markRaw(InstanceView),
            introduce: "实例",
            line_icon: markRaw(IconDatabaseLine),
            fill_icon: markRaw(IconDatabaseFill),
        } as unknown as ViewPluginObject
    },
    {
        name: 'pluginManager',
        type: 'view',
        enable: true,
        Object: {
            name: 'instance',
            component: markRaw(PluginManagerView),
            introduce: "插件管理",
            line_icon: markRaw(IconArchive2Line),
            fill_icon: markRaw(IconArchive2Fill),
        } as unknown as ViewPluginObject
    }
]

export const useViewStore = defineStore('view', () => {
    const views: Ref<Map<string, ViewPluginItem>> = ref(new Map<string, ViewPluginItem>())

    async function Load() {
        defaultViews.map(view => {
            views.value.set(view.name, view)
        })
    }

    async function AddView(view: ViewPluginItem) {
        views.value.set(view.name, view)
    }

    return {
        views: toRef(views),
        Load,
        AddView
    }
})