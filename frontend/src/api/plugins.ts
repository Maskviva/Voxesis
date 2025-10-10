import * as Plugins from '../../bindings/voxesis/src/Communication/InterProcess/pluginipc'
import {envIsWails} from "./common";

export async function GetPluginList() {
    if (envIsWails) {
        return Plugins.GetPluginList()
    } else {
        const res = await fetch("/api/plugins/GetPluginList", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })

        return res.json()
    }
}

export async function LoadPlugins() {
    if (envIsWails) {
        return Plugins.LoadPlugins()
    } else {
        const res = await fetch("/api/plugins/LoadPlugins", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })

        return res.json()
    }
}

export default {
    GetPluginList,
    LoadPlugins
}
