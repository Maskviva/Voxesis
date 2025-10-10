// mcServerInstanceManager.ts
import {ConfigType, ProcessType} from "../../bindings/voxesis/src/Common/Manager";
import {ElMessage} from "element-plus";
import {DelValueOfKey, GetAllValue, NewConfigManager, SetValueOfKey} from "../api/config";
import {GetProcessStatus, NewProcess, SendCommand, Start, Stop} from "../api/process";

export interface ServerConfig {
    id: number;
    name: string;
    path: string;
    abs: boolean;
    conPty: boolean;
    args: string[];
}

const handleError = (operation: string, error: any) => {
    console.error(`${operation} error:`, error);
};

export class McServerConfigManager {
    private configUuid: string = "";
    private serverManagers = new Map<number, McServerManager>();

    async initialize() {
        try {
            const [uuid, error] = await NewConfigManager(
                ConfigType.$JSON,
                "./config/mcServer.config.json",
                false
            );

            if (error || !uuid) {
                handleError("ConfigManager initialization", error || "UUID not returned");
                return;
            }

            this.configUuid = uuid!;
            await this.loadServers();
        } catch (error) {
            handleError("McServerConfigManager initialization", error);
        }
    }

    async createServer(config: Omit<ServerConfig, "id">): Promise<{
        id: number,
        manager: McServerManager,
        config: ServerConfig
    } | null> {
        for (const [_, config] of Object.entries(await this.getAllServers())) {
            if (config.name == config.name) {
                ElMessage({
                    message: "已存在相同名称的实例",
                    type: "error",
                })
                return null;
            }
        }

        for (const manager of this.serverManagers.values()) {
            if (manager.path == config.path && manager.isAbsolutePath == config.abs) {
                ElMessage({
                    message: "已存在相同路径的实例",
                    type: "error",
                })
                return null
            }
        }

        try {
            const fullConfig: ServerConfig = {id: 0, ...config};

            const manager = new McServerManager(
                fullConfig.conPty,
                fullConfig.path,
                fullConfig.abs,
                fullConfig.args,
            );

            const id = await manager.initialize();
            fullConfig.id = id;
            this.serverManagers.set(id, manager);

            const setError = await SetValueOfKey(
                this.configUuid,
                String(id),
                JSON.stringify(fullConfig),
                ""
            );

            if (setError) {
                handleError("SetValueOfKey in createServer", setError);
                this.serverManagers.delete(id);
                return null;
            }

            return {id, manager, config: fullConfig};
        } catch (error) {
            handleError("createServer", error);
            return null;
        }
    }

    getServer(id
              :
              number
    ):
        McServerManager | undefined {
        return this.serverManagers.get(id);
    }

    async getAllServers(): Promise<Record<string, ServerConfig>> {
        try {
            const [values, error] = await GetAllValue(this.configUuid);
            if (error) {
                handleError("getAllServers", error);
                return {};
            }

            return Object.entries(values || {}).reduce((acc, [key, value]) => {
                try {
                    acc[key] = JSON.parse(value as string);
                } catch (parseError) {
                    console.error(`Error parsing config for key ${key}:`, parseError);
                }
                return acc;
            }, {} as Record<string, ServerConfig>);
        } catch (error) {
            handleError("getAllServers", error);
            return {};
        }
    }

    async deleteServer(id: number):
        Promise<void> {
        try {
            const manager = this.serverManagers.get(id);
            if (!manager) return;

            const status = await manager.getStatus();

            if (status) {
                await manager.stop();
            }

            this.serverManagers.delete(id);

            const delError = await DelValueOfKey(this.configUuid, String(id));
            if (delError) handleError("deleteServer", delError);
        } catch (error) {
            handleError("deleteServer", error);
        }
    }

    private async loadServers() {
        try {
            const servers = await this.getAllServers();

            for (const [id, config] of Object.entries(servers)) {
                const manager = new McServerManager(
                    config.conPty,
                    config.path,
                    config.abs,
                    config.args,
                );

                await manager.initialize();
                this.serverManagers.set(Number(id), manager);
            }
        } catch (error) {
            handleError("loadServers", error);
        }
    }
}

export class McServerManager {
    private processid: number;
    private readonly isConPty: boolean;
    private readonly args: string[];

    public readonly isAbsolutePath: boolean;
    public readonly path: string;

    constructor(
        isConPty: boolean,
        path: string,
        isAbsolutePath: boolean,
        args: string[],
    ) {
        this.isConPty = isConPty;
        this.path = path;
        this.isAbsolutePath = isAbsolutePath;
        this.args = args;
    }

    async initialize(): Promise<number> {
        try {
            const id = await NewProcess(
                this.isConPty ? ProcessType.ConPty : ProcessType.Ordinary,
                this.isAbsolutePath,
                this.path,
                ...this.args);

            this.processid = id!;

            return id;
        } catch (error) {
            handleError("McServerManager initialization", error);
            return Promise.reject(error);
        }
    }

    async start(): Promise<void> {
        try {
            const error = await Start(this.processid);

            if (error) handleError("start", error);
        } catch (error) {
            handleError("start", error);
        }
    }

    async stop(): Promise<void> {
        try {
            const error = await Stop(this.processid);

            if (error) handleError("stop", error);
        } catch (error) {
            handleError("stop", error);
        }
    }

    async getStatus(): Promise<any> {
        try {
            const [status, error] = await GetProcessStatus(this.processid)

            if (error) {
                handleError("getStatus", error);
                return null;
            }
            return status;
        } catch (error) {
            handleError("getStatus", error);
            return null;
        }
    }

    async sendCommand(command: string): Promise<void> {
        try {
            const error = await SendCommand(this.processid, command);

            if (error) handleError("sendCommand", error);
        } catch (error) {
            handleError("sendCommand", error);
        }
    }
}