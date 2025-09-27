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
import {ShallowRef, shallowRef} from 'vue'

export interface ServerState {
    pid: string;
    cpu: { value: number; time: string }[];
    memory: { value: number; time: string }[];
    runTime: string;
}

export const ServersState: ShallowRef<Map<string, ServerState>> = shallowRef(new Map());

export class mcServerConfigManager {
    private uuid: string = "";
    private mcServerManagerMap: Map<string, mcServerManager> = new Map<string, mcServerManager>()

    constructor() {
    }

    create() {
        return NewConfigManager(ConfigType.$JSON, "./config/mcServer.config.json", false).then(([uuid, err]) => {
            if (err) {
                throw new Error("NewConfigManager error:" + err);
            }
            this.uuid = uuid!;
            this.init();
        });
    }

    NewServer(name: string, path: string, abs: boolean, conPty: boolean, args: string[]) {
        const id = String(this.mcServerManagerMap.size + 1)
        const outputEventName = "mcServerOutput<" + id
        const newManager = new mcServerManager(conPty, path, abs, args, outputEventName)

        this.mcServerManagerMap.set(id, newManager)

        SetValueOfKey(this.uuid, id, JSON.stringify({name, path, abs, conPty, outputEventName, args}), "")

        return newManager.create()
    }

    async GetServer(name: string) {
        const [avl, err] = await GetAllValue(this.uuid)
        if (err) {
            throw new Error("GetAllValue error:" + err);
        }

        for (const key in avl) {
            const server = JSON.parse(avl[key])

            if (server['name'] == name) {
                return this.mcServerManagerMap.get(key)
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
            const server = JSON.parse(avl[String(key)])
            if (server['name'] === name) {
                this.mcServerManagerMap.delete(String(key))
                DelValueOfKey(this.uuid, String(key)).then(err => err ? console.error(err) : null)
            }
        }
    }

    private init() {
        GetAllValue(this.uuid).then(([avl, err]) => {
            if (err) {
                throw new Error("GetAllValue error:" + err);
            }

            for (const key in avl) {
                const server = JSON.parse(avl[key])
                this.NewServer(server['name'], server['path'], server['abs'], server['conPty'], server['args'])
            }

        })
    }
}

export class mcServerManager {
    private readonly args: string[];
    private readonly conPty: boolean;
    private path: string;
    private abs: boolean;
    private readonly outputEventName: string;

    private uuid: string = "";

    constructor(conPty: boolean, path: string, abs: boolean, args: string[], outputEventName: string) {
        this.args = args;
        this.conPty = conPty;
        this.path = path
        this.abs = abs
        this.outputEventName = outputEventName;
    }

    create() {
        if (this.conPty) {
            NewConPtyProcess(this.path, this.abs).then(([uuid, err]) => {
                if (err) {
                    throw new Error("NewConPtyProcess error:" + err);
                }

                this.uuid = uuid!;
            })
        } else {
            NewOrdinaryProcess(this.path, this.abs).then(([uuid, err]) => {
                if (err) {
                    throw new Error("NewOrdinaryProcess error:" + err);
                }

                this.uuid = uuid!;
            })
        }
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