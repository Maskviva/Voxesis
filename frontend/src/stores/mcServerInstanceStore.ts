// mcServerInstanceStore.ts

import {createPinia, defineStore, setActivePinia} from 'pinia';
import {McServerConfigManager, McServerManager, ServerConfig} from "../instance/mcServerInstanceManager";
import {readonly, ref} from "vue";
import {Events} from "@wailsio/runtime";
import {usePlayerListStore} from "./playerListStore";

export type InstanceCreationInfo = Omit<ServerConfig, "outputEventName">;

export type OutputCallback = (output: { id: string, data: string }) => void;

export type ProcessState = {
    status: 'running' | 'stopped' | 'starting' | 'stopping';
    pid: string | null;
    cpu: { value: number; time: string }[];
    memory: { value: number; time: string }[];
    runTime: string;
    output: string[];
}

export type InstanceState = {
    id: string;
    instanceInfo: ServerConfig;
    processState: ProcessState;
    serverManager: McServerManager;
}

const mcServerConfigManager = new McServerConfigManager();
const pinia = createPinia()

setActivePinia(pinia)
const playerListStore = usePlayerListStore()

export const useInstancesStore = defineStore('instance', () => {
    const instances = ref<InstanceState[]>([]);
    const isInitialized = ref(false);
    let onOutputCallback: OutputCallback | null = null;

    const findInstance = (id: string) => instances.value.find(inst => inst.id === id);

    const setupOutputListener = (instance: InstanceState) => {
        Events.On(instance.instanceInfo.outputEventName, (data) => {
            const targetInstance = findInstance(instance.id);

            if (targetInstance) {
                targetInstance.processState.output.push(data.data);
                if (targetInstance.processState.output.length > 1000) {
                    targetInstance.processState.output.shift();
                }
            }

            if (onOutputCallback) {
                onOutputCallback({id: instance.id, data: data.data});
            }

            data.data.forEach((line: string) => {
                playerListStore.parseLogMessage(instance.id, line)
            })
        })
    };

    function setOnOutput(callback: OutputCallback) {
        onOutputCallback = callback;
    }

    async function initializeStore() {
        if (isInitialized.value) return;

        await mcServerConfigManager.initialize();
        const serverConfigs = await mcServerConfigManager.getAllServers();

        const loadedInstances: InstanceState[] = [];
        for (const [id, config] of Object.entries(serverConfigs)) {
            const manager = mcServerConfigManager.getServer(id);
            if (manager) {
                const instance: InstanceState = {
                    id,
                    instanceInfo: config,
                    serverManager: manager,
                    processState: {
                        status: 'stopped',
                        pid: null,
                        cpu: [],
                        memory: [],
                        runTime: "0s",
                        output: [],
                    },
                };
                setupOutputListener(instance);
                loadedInstances.push(instance);
            }
        }
        instances.value = loadedInstances;
        isInitialized.value = true;

        await Promise.all(instances.value.map(inst => updateInstanceStatus(inst.id)));
    }

    async function createInstance(creationInfo: InstanceCreationInfo) {
        const newServer = await mcServerConfigManager.createServer(creationInfo);

        if (newServer) {
            const {id, manager, config} = newServer;
            const newInstance: InstanceState = {
                id,
                instanceInfo: config,
                serverManager: manager,
                processState: {
                    status: 'stopped',
                    pid: null,
                    cpu: [],
                    memory: [],
                    runTime: '0s',
                    output: [],
                }
            };

            setupOutputListener(newInstance);
            instances.value.push(newInstance);
        } else {
            console.error("Failed to create server instance in the store.");
        }
    }

    async function deleteInstance(id: string) {
        await mcServerConfigManager.deleteServer(id);
        instances.value = instances.value.filter(instance => instance.id !== id);
    }

    async function startInstance(id: string) {
        const instance = findInstance(id);
        if (instance && instance.processState.status === 'stopped') {
            instance.processState.status = 'starting';
            await instance.serverManager.start();
            await updateInstanceStatus(id);
        }
    }

    async function stopInstance(id: string) {
        const instance = findInstance(id);
        if (instance && instance.processState.status === 'running') {
            instance.processState.status = 'stopping';
            await instance.serverManager.stop();
            await updateInstanceStatus(id);
        }
    }

    async function sendCommandToInstance(id: string, command: string) {
        const instance = findInstance(id);
        if (instance && instance.processState.status === 'running') {
            await instance.serverManager.sendCommand(command);
        }
    }

    async function updateInstanceStatus(id: string) {
        const instance = findInstance(id);
        if (instance) {
            const status = await instance.serverManager.getStatus();
            if (status) {
                instance.processState.status = 'running';
                instance.processState.cpu.push({
                    value: status.cpu,
                    time: status.runTime,
                });
                instance.processState.memory.push({
                    value: status.memory,
                    time: status.runTime,
                });
                instance.processState.pid = status.pid;
                instance.processState.runTime = status.runTime;
            } else {
                instance.processState.status = 'stopped';
                instance.processState.pid = null;
                instance.processState.runTime = '0s';
            }
        }
    }

    return {
        instances: readonly(instances),
        isInitialized: readonly(isInitialized),

        setOnOutput,
        initializeStore,
        createInstance,
        deleteInstance,
        startInstance,
        stopInstance,
        sendCommandToInstance,
        updateInstanceStatus,
    };
});