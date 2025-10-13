import {defineStore} from "pinia";
import {Component, markRaw, Ref, ref, toRef} from "vue";
import InstanceView from "../../view/Instance.vue";
import {IconArchive2Fill, IconArchive2Line, IconDatabaseFill, IconDatabaseLine} from "birdpaper-icon";
import PluginManagerView from "../../view/PluginManager.vue";

export type ViewItem = {
    name: string;
    component: Component;
    enable: boolean;
    introduce: string;
    line_icon: Component;
    fill_icon: Component;
}

const defaultViews: ViewItem[] = [
    {
        name: 'instance',
        component: markRaw(InstanceView),
        introduce: "实例",
        enable: true,
        line_icon: markRaw(IconDatabaseLine),
        fill_icon: markRaw(IconDatabaseFill),
    },
    {
        name: 'pluginManager',
        component: markRaw(PluginManagerView),
        introduce: "插件管理",
        enable: true,
        line_icon: markRaw(IconArchive2Line),
        fill_icon: markRaw(IconArchive2Fill),
    }
]

export const useViewStore = defineStore('view', () => {
    const views: Ref<Map<string, ViewItem>> = ref(new Map<string, ViewItem>())

    async function LoadViews() {
        defaultViews.map(view => {
            views.value.set(view.name, view)
        })
    }

    async function AddView(view: ViewItem) {
        if (view.component) {
            const markedComponent = markRaw(view.component);

            views.value.set(view.name, {
                name: view.name,
                component: markedComponent,
                introduce: view.introduce,
                enable: true,
                line_icon: markRaw(view.line_icon),
                fill_icon: markRaw(view.fill_icon),
            })
        } else {
            throw new Error('Component is undefined or null for view:' + view.name);
        }
    }

    return {
        views: toRef(views),
        LoadViews,
        AddView
    }
})