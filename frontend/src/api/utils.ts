import * as Utils from "../../bindings/voxesis/src/Communication/InterProcess/utilsipc"
import {envIsWails} from "./common";
import {BedrockMcServerStatus, SystemState} from "../../bindings/voxesis/src/Common/Entity";

export async function GetBeServerStatus(host: string, port: number): Promise<BedrockMcServerStatus | null> {
    if (envIsWails) {
        return Utils.GetBeServerStatus(host, port)
    } else {
        const res = await fetch("/api/utils/GetBeServerStatus", {
            method: "GET",
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

export default {
    GetBeServerStatus,
    GetSystemState
}