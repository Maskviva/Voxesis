import * as Utils from "../../bindings/voxesis/src/Communication/InterProcess/utilsipc"
import {envIsWails} from "./common";
import {BedrockMcServerStatus, SystemState} from "../../bindings/voxesis/src/Common/Entity";
import {HttpRequestOptions} from "../../bindings/voxesis/src/Common/Utils";

export async function GetBeServerStatus(host: string, port: number): Promise<BedrockMcServerStatus | null> {
    if (envIsWails) {
        return Utils.GetBeServerStatus(host, port)
    } else {
        const res = await fetch("/api/utils/GetBeServerStatus", {
            method: "POST",
            headers: {

                "Content-Type": "application/json"
            },
            body: JSON.stringify({host, port})
        })

        return res.json()
    }
}

export async function GetSystemState(): Promise<SystemState | null> {
    if (envIsWails) {
        return Utils.GetSystemState()
    } else {
        const res = await fetch("/api/utils/GetSystemState", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })

        return res.json()
    }
}

export async function HttpRequest(options: HttpRequestOptions): Promise<[string | null, string | null]> {
    if (envIsWails) {
        return Utils.HttpRequest(options)
    } else {
        const res = await fetch("/api/utils/HttpRequest", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(options)
        })

        return res.json()
    }
}

export default {
    GetBeServerStatus,
    GetSystemState
}