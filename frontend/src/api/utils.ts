import * as Utils from "../../bindings/voxesis/src/Communication/InterProcess/utilsipc"
import {envIsWails} from "./common";

export async function GetBeServerStatus(host: string, port: number) {
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

export async function GetSystemState() {
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