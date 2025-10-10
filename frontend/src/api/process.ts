import * as Processipc from "../../bindings/voxesis/src/Communication/InterProcess/processipc"
import {envIsWails} from "./common";
import {ProcessType} from "../../bindings/voxesis/src/Common/Manager";

export async function GetProcessStatus(uuid: number) {
    if (envIsWails) {
        return Processipc.GetProcessStatus(uuid)
    } else {
        const res = await fetch("/api/process/GetProcessStatus", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uuid: uuid,
            })
        })

        return res.json()
    }
}

export async function NewProcess(processType: ProcessType, abs: boolean, relPath: string, ...args: string[]) {
    if (envIsWails) {
        return Processipc.NewProcess(processType, abs, relPath, ...args)
    } else {
        const res = await fetch("/api/process/NewProcess", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                processType: processType,
                abs: abs,
                relPath: relPath,
                args: args
            })
        })

        return res.json()
    }
}

export async function SendCommand(uuid: number, command: string) {
    if (envIsWails) {
        return Processipc.SendCommand(uuid, command)
    } else {
        const res = await fetch("/api/process/SendCommand", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({uuid, command})
        })

        return res.json()
    }
}

export async function Start(uuid: number) {
    if (envIsWails) {
        return Processipc.Start(uuid)
    } else {
        const res = await fetch("/api/process/Start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({uuid})
        })

        return res.json()
    }
}

export async function Stop(uuid: number) {
    if (envIsWails) {
        return Processipc.Stop(uuid)
    } else {
        const res = await fetch("/api/process/Stop", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({uuid})
        })

        return res.json()
    }
}

export default {
    GetProcessStatus,
    NewProcess,
    SendCommand,
    Start,
    Stop
}
