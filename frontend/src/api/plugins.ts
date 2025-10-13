import * as PluginsIpc from '../../bindings/voxesis/src/Communication/InterProcess/pluginipc'
import {envIsWails} from "./common";
import {Plugin} from "../../bindings/voxesis/src/Common/Entity"

export async function GetPluginList(): Promise<Plugin[] | null> {
    if (envIsWails) {
        return PluginsIpc.GetPluginList()
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

export async function LoadPlugins(): Promise<string | null> {
    if (envIsWails) {
        return PluginsIpc.LoadPlugins()
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
