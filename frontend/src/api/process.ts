import * as ProcessIpc from "../../bindings/voxesis/src/Communication/InterProcess/processipc"
import {envIsWails} from "./common";
import {ProcessType} from "../../bindings/voxesis/src/Common/Manager";
import { Events } from "@wailsio/runtime";
import {ProcessState} from "../../bindings/voxesis/src/Common/Entity";

export async function GetProcessStatus(uuid: number): Promise<[ProcessState | null, string | null]> {
    if (envIsWails) {
        return ProcessIpc.GetProcessStatus(uuid)
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

export async function NewProcess(processType: ProcessType, abs: boolean, relPath: string, ...args: string[]): Promise<number> {
    if (envIsWails) {
        return ProcessIpc.NewProcess(processType, abs, relPath, ...args)
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

export async function SendCommand(uuid: number, command: string): Promise<string | null> {
    if (envIsWails) {
        return ProcessIpc.SendCommand(uuid, command)
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

export async function Start(uuid: number): Promise<string | null> {
    if (envIsWails) {
        return ProcessIpc.Start(uuid)
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

export async function Stop(uuid: number): Promise<string | null> {
    if (envIsWails) {
        return ProcessIpc.Stop(uuid)
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

export async function GetProcessOutput(uuid: number, callback: (data: string) => void): Promise<void> {
    if (envIsWails) {
        Events.On("process-" + uuid + "-output", (data) => {
            callback(data.data);
        });
    } else {
        const ws = new WebSocket("ws://localhost:8080/api/process/GetProcessOutput")
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.uuid == uuid) {
                callback(data.data)
            }
        }
    }
}

export default {
    GetProcessStatus,
    NewProcess,
    SendCommand,
    Start,
    Stop
}
