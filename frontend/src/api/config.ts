import * as ConfigIpc from "../../bindings/voxesis/src/Communication/InterProcess/configipc"
import {ConfigType} from "../../bindings/voxesis/src/Common/Manager";
import {envIsWails} from "./common";

export async function SetValueOfKey(uuid: string, key: string, value: any, section: string) {
    if (envIsWails) {
        return ConfigIpc.SetValueOfKey(uuid, key, value, section)
    } else {
        const res = await fetch("/api/config/SetValueOfKey", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uuid: uuid,
                key: key,
                value: value,
                section: section
            })
        })

        return res.json()
    }
}

export async function DelValueOfKey(uuid: string, key: string) {
    if (envIsWails) {
        return ConfigIpc.DelValueOfKey(uuid, key)
    } else {
        const res = await fetch("/api/config/DelValueOfKey", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uuid: uuid,
                key: key
            })
        })

        return res.json()
    }
}

export async function GetAllValue(uuid: string) {
    if (envIsWails) {
        return ConfigIpc.GetAllValue(uuid)
    } else {
        const res = await fetch("/api/config/GetAllValue", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uuid: uuid
            })
        })

        return res.json()
    }
}

export async function GetValueOfKey(uuid: string, key: string, section: string) {
    if (envIsWails) {
        return ConfigIpc.GetValueOfKey(uuid, key, section)
    } else {
        const res = await fetch("/api/config/GetValueOfKey", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uuid: uuid,
                key: key,
                section: section
            })
        })

        return res.json()
    }
}

export async function NewConfigManager(managerType: ConfigType, filePath: string, abs: boolean) {
    if (envIsWails) {
        return ConfigIpc.NewConfigManager(managerType, filePath, abs)
    } else {
        const res = await fetch("/api/config/NewConfigManager", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                managerType: managerType,
                filePath: filePath,
                abs: abs
            })
        })

        return res.json()
    }
}

export default {
    SetValueOfKey,
    DelValueOfKey,
    GetAllValue,
    GetValueOfKey,
    NewConfigManager
}
