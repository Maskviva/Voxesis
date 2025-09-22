import {
    ConPtyProcessStart,
    ConPtyProcessStop,
    GetConPtyProcessStatus,
    NewConPtyProcess,
    SendCommandToConPtyProcess
} from "../../bindings/voxesis/src/Communication/InterProcess/conptyprocessipc";
import {
    GetOrdinaryProcessStatus,
    NewOrdinaryProcess,
    OrdinaryProcessStart,
    OrdinaryProcessStop,
    SendCommandToOrdinaryProcess
} from "../../bindings/voxesis/src/Communication/InterProcess/ordinaryprocessipc";
import {
    DelValueOfKey,
    GetAllValue,
    NewConfigManager,
    SetValueOfKey
} from "../../bindings/voxesis/src/Communication/InterProcess/configipc";
import {ConfigType} from "../../bindings/voxesis/src/Common/Manager";

export class mcServerConfigManager {
    private uuid: string = "";
    private mcServerManagerMap: Map<string, mcServerManager> = new Map<string, mcServerManager>()

    constructor() {
    }

    create() {
        return NewConfigManager(ConfigType.$JSON, "./config/mcServer.config.json", false).then(([uuid, err]) => {
            if (err) {
                throw new Error("NewConfigManager error:" + err);
            } else {
                this.uuid = uuid!;
                this.init()
            }
        })
    }

    NewServer(name: string, path: string, abs: boolean, conPty: boolean, args: string[]) {
        const id = String(this.mcServerManagerMap.size + 1)
        const outputEventName = "mcServerOutput<" + id

        this.mcServerManagerMap.set(id, new mcServerManager(conPty, path, abs, args, outputEventName))

        SetValueOfKey(this.uuid, id, JSON.stringify({name, path, conPty, outputEventName, args}), "")
    }

    async GetServer(name: string) {
        const [avl, err] = await GetAllValue(this.uuid)
        if (err) {
            throw new Error("GetAllValue error:" + err);
        }

        for (const value in avl) {
            const server = JSON.parse(avl[value])
            if (server['name'] === name) {
                return this.mcServerManagerMap.get(name)
            }
        }
        return null
    }

    async GetAllServerData() {
        const [avl, err] = await GetAllValue(this.uuid)
        if (err) {
            throw new Error("GetAllValue error:" + err);
        }

        return avl;
    }

    async DelServer(name: string) {
        const [avl, err] = await GetAllValue(this.uuid)
        if (err) {
            throw new Error("GetAllValue error:" + err);
        }

        for (const key in avl) {
            const server = JSON.parse(avl[key])
            if (server['name'] === name) {
                this.mcServerManagerMap.delete(key)
                DelValueOfKey(this.uuid, key)
            }
        }
    }

    private init() {
        GetAllValue(this.uuid).then(([avl, err]) => {
            for (const key in avl) {
                const server = JSON.parse(avl[key])
                this.mcServerManagerMap.set(key, new mcServerManager(server['conPty'], server['path'], true, server['args'], server['outputEventName']))
            }
        })
    }
}

export class mcServerManager {
    private readonly args: string[];
    private readonly conPty: boolean;
    private readonly outputEventName: string;

    private uuid: string = "";

    constructor(conPty: boolean, path: string, abs: boolean, args: string[], outputEventName: string) {
        if (conPty) {
            NewConPtyProcess(path, abs).then(([uuid, err]) => {
                if (err) {
                    throw new Error("NewConPtyProcess error:" + err);
                }

                this.uuid = uuid!;
            })
        } else {
            NewOrdinaryProcess(path, abs).then(([uuid, err]) => {
                if (err) {
                    throw new Error("NewOrdinaryProcess error:" + err);
                }

                this.uuid = uuid!;
            })
        }
        this.args = args;
        this.conPty = conPty;
        this.outputEventName = outputEventName;
    }

    Start() {
        if (this.conPty) {
            ConPtyProcessStart(this.uuid, this.outputEventName, this.args)
        } else {
            OrdinaryProcessStart(this.uuid, this.outputEventName, this.args)
        }
    }

    Stop() {
        if (this.conPty) {
            ConPtyProcessStop(this.uuid)
        } else {
            OrdinaryProcessStop(this.uuid)
        }
    }

    GetStatus() {
        if (this.conPty) {
            return GetConPtyProcessStatus(this.uuid)
        } else {
            return GetOrdinaryProcessStatus(this.uuid)
        }
    }

    SendCommand(command: string) {
        if (this.conPty) {
            SendCommandToConPtyProcess(this.uuid, command)
        } else {
            SendCommandToOrdinaryProcess(this.uuid, command)
        }
    }
}