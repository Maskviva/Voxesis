// mcServerInstanceManager.ts
import {ShallowRef, shallowRef} from 'vue'
import {
    DelValueOfKey,
    GetAllValue,
    NewConfigManager,
    SetValueOfKey
} from "../../bindings/voxesis/src/Communication/InterProcess/configipc";
import {ConfigType} from "../../bindings/voxesis/src/Common/Manager";
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

// Interface definitions remain the same
export interface ServerState {
    pid: string;
    cpu: { value: number; time: string }[];
    memory: { value: number; time: string }[];
    runTime: string;
}

export interface ServerConfig {
    name: string;
    path: string;
    abs: boolean;
    conPty: boolean;
    args: string[];
    outputEventName: string;
}

const handleError = (operation: string, error: any) => {
    console.error(`${operation} error:`, error);
};

export class McServerConfigManager {
    private configUuid: string = "";
    private serverManagers = new Map<string, McServerManager>();

    async initialize() {
        try {
            const [uuid, error] = await NewConfigManager(
                ConfigType.$JSON,
                "./config/mcServer.config.json",
                false
            );

            if (error || !uuid) {
                handleError("ConfigManager initialization", error || "UUID not returned");
                return; // Guard against further execution
            }

            this.configUuid = uuid!;
            await this.loadServers();
        } catch (error) {
            handleError("McServerConfigManager initialization", error);
        }
    }

    /**
     * Creates a server, saves it, and returns its new ID, manager, and config.
     * This is more efficient for the store than re-fetching.
     */
    async createServer(config: Omit<ServerConfig, "outputEventName">): Promise<{
        id: string,
        manager: McServerManager,
        config: ServerConfig
    } | null> {
        try {
            const id = String(this.serverManagers.size + 1); // Use a robust unique ID
            const outputEventName = `mc-server-output-${id}`; // Ensure event name is unique
            const fullConfig: ServerConfig = {...config, outputEventName};

            const manager = new McServerManager(
                fullConfig.conPty,
                fullConfig.path,
                fullConfig.abs,
                fullConfig.args,
                fullConfig.outputEventName
            );

            const uuid = await manager.initialize();
            this.serverManagers.set(id, manager);

            const setError = await SetValueOfKey(
                this.configUuid,
                id,
                JSON.stringify(fullConfig),
                ""
            );

            if (setError) {
                handleError("SetValueOfKey in createServer", setError);
                this.serverManagers.delete(id); // Rollback
                return null;
            }

            return {id, manager, config: fullConfig};
        } catch (error) {
            handleError("createServer", error);
            return null;
        }
    }

    getServer(id: string): McServerManager | undefined {
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

    async deleteServer(id: string): Promise<void> {
        try {
            const manager = this.serverManagers.get(id);
            if (!manager) return;

            const status = await manager.getStatus();
            console.log('awdawd')
            if (status) {
                await manager.stop();
            }

            this.serverManagers.delete(id);

            const delError = await DelValueOfKey(this.configUuid, id);
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
                    config.outputEventName
                );

                await manager.initialize();
                this.serverManagers.set(id, manager);
            }
        } catch (error) {
            handleError("loadServers", error);
        }
    }
}


// McServerManager class remains unchanged as its role is already well-defined.
export class McServerManager {
    private processUuid: string = "";
    private readonly isConPty: boolean;
    private readonly path: string;
    private readonly isAbsolutePath: boolean;
    private readonly args: string[];
    private readonly outputEventName: string;

    constructor(
        isConPty: boolean,
        path: string,
        isAbsolutePath: boolean,
        args: string[],
        outputEventName: string
    ) {
        this.isConPty = isConPty;
        this.path = path;
        this.isAbsolutePath = isAbsolutePath;
        this.args = args;
        this.outputEventName = outputEventName;
    }

    async initialize(): Promise<string> {
        try {
            const [uuid, error] = this.isConPty
                ? await NewConPtyProcess(this.path, this.isAbsolutePath)
                : await NewOrdinaryProcess(this.path, this.isAbsolutePath);

            if (error || !uuid) {
                handleError("Process initialization", error || "UUID not returned");
            }

            this.processUuid = uuid!;

            return uuid;
        } catch (error) {
            handleError("McServerManager initialization", error);
            return Promise.reject(error);
        }
    }

    async start(): Promise<void> {
        try {
            const error = this.isConPty
                ? await ConPtyProcessStart(this.processUuid, this.outputEventName, this.args)
                : await OrdinaryProcessStart(this.processUuid, this.outputEventName, this.args);

            if (error) handleError("start", error);
        } catch (error) {
            handleError("start", error);
        }
    }

    async stop(): Promise<void> {
        try {
            const error = this.isConPty
                ? await ConPtyProcessStop(this.processUuid)
                : await OrdinaryProcessStop(this.processUuid);

            if (error) handleError("stop", error);
        } catch (error) {
            handleError("stop", error);
        }
    }

    async getStatus(): Promise<any> {
        try {
            const [status, error] = this.isConPty
                ? await GetConPtyProcessStatus(this.processUuid)
                : await GetOrdinaryProcessStatus(this.processUuid);

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
            const error = this.isConPty
                ? await SendCommandToConPtyProcess(this.processUuid, command)
                : await SendCommandToOrdinaryProcess(this.processUuid, command);

            if (error) handleError("sendCommand", error);
        } catch (error) {
            handleError("sendCommand", error);
        }
    }
}