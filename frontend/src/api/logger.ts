import * as Logger from '../../bindings/voxesis/src/Communication/InterProcess/loggeripc'
import {envIsWails} from "./common";

export async function CloseLogger(uuid: string): Promise<string | null> {
    if (envIsWails) {
        return Logger.CloseLogger(uuid)
    } else {
        const res = await fetch(`/api/logger/CloseLogger}`, {
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

export async function LogDebug(uuid: string, logLine: string): Promise<string | null> {
    if (envIsWails) {
        return Logger.LogDebug(uuid, logLine)
    } else {
        const res = await fetch(`/api/logger/LogDebug}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({uuid, logLine})
        })

        return res.json()
    }
}

export async function LogError(uuid: string, logLine: string): Promise<string | null> {
    if (envIsWails) {
        return Logger.LogError(uuid, logLine)
    } else {
        const res = await fetch(`/api/logger/LogError}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({uuid, logLine})
        })

        return res.json()
    }
}

export async function LogInfo(uuid: string, logLine: string): Promise<string | null> {
    if (envIsWails) {
        return Logger.LogInfo(uuid, logLine)
    } else {
        const res = await fetch(`/api/logger/LogInfo}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({uuid, logLine})
        })

        return res.json()
    }
}

export async function LogWarn(uuid: string, logLine: string): Promise<string | null> {
    if (envIsWails) {
        return Logger.LogWarn(uuid, logLine)
    } else {
        const res = await fetch(`/api/logger/LogWarn}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({uuid, logLine})
        })

        return res.json()
    }
}

export async function NewLogger(logDir: string, logFileName: string, date: boolean): Promise<[string | null, string | null]> {
    if (envIsWails) {
        return Logger.NewLogger(logDir, logFileName, date)
    } else {
        const res = await fetch(`/api/logger/NewLogger}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({logDir, logFileName, date})
        })

        return res.json()
    }
}

export default {
    CloseLogger,
    LogDebug,
    LogError,
    LogInfo,
    LogWarn,
    NewLogger
}