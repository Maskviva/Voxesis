// mcServerInstanceStore.ts

import {defineStore} from 'pinia';
import {McServerConfigManager, McServerManager, ServerConfig} from "../../instance/McServerInstanceManager";
import {readonly, ref} from "vue";
import {GetProcessOutput} from "../../api/process";

export type OutputCallback = (output: { id: number, data: string[] }) => void;

export type ProcessState = {
    status: 'running' | 'stopped' | 'starting' | 'stopping';
    pid: string | null;
    cpu: { value: number; time: string }[];
    memory: { value: number; time: string }[];
    runTime: string;
    output: string[];
}

export type InstanceState = {
    instanceInfo: ServerConfig;
    processState: ProcessState;
    serverManager: McServerManager;
}

const mcServerConfigManager = new McServerConfigManager();

export const useInstancesStore = defineStore('instance', () => {
    const instances = ref<InstanceState[]>([]);
    const isInitialized = ref(false);
    const outputCallbacks = new Map<number, OutputCallback[]>();

    const findInstance = (id: number) => instances.value.find(inst => inst.instanceInfo.id === id);

    const setupOutputListener = (instance: InstanceState) => {
        GetProcessOutput(instance.instanceInfo.id, (data: string) => {
            const targetInstance = findInstance(instance.instanceInfo.id);

            if (targetInstance) {
                targetInstance.processState.output.push(data);
                if (targetInstance.processState.output.length > 1000) {
                    targetInstance.processState.output.shift();
                }
            }

            if (outputCallbacks.has(instance.instanceInfo.id)) {
                outputCallbacks.get(instance.instanceInfo.id)?.forEach(cb => cb({
                    id: instance.instanceInfo.id,
                    data: Array.isArray(data) ? data : [data]
                }));
            }
        })
        // Events.On("process-" + instance.instanceInfo.id + "-output", (data) => {
        //     const targetInstance = findInstance(instance.instanceInfo.id);
        //
        //     if (targetInstance) {
        //         targetInstance.processState.output.push(data.data);
        //         if (targetInstance.processState.output.length > 1000) {
        //             targetInstance.processState.output.shift();
        //         }
        //     }
        //
        //     if (outputCallbacks.has(instance.instanceInfo.id)) {
        //         outputCallbacks.get(instance.instanceInfo.id)?.forEach(cb => cb({
        //             id: instance.instanceInfo.id,
        //             data: data.data
        //         }));
        //     }
        // })
    };

    function subscribeToOutput(instanceId: number, callback: OutputCallback) {
        if (!outputCallbacks.has(instanceId)) {
            outputCallbacks.set(instanceId, []);
        }
        outputCallbacks.get(instanceId)?.push(callback);
    }

    function unsubscribeFromOutput(instanceId: number, callback: OutputCallback) {
        if (!outputCallbacks.has(instanceId)) {
            outputCallbacks.set(instanceId, []);
        }
        outputCallbacks.delete(instanceId)
    }

    async function initializeStore() {
        if (isInitialized.value) return;

        await mcServerConfigManager.initialize();
        const serverConfigs = await mcServerConfigManager.getAllServers();

        const loadedInstances: InstanceState[] = [];
        for (const [id, config] of Object.entries(serverConfigs)) {
            const manager = mcServerConfigManager.getServer(Number(id));
            if (manager) {
                const instance: InstanceState = {
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

        await Promise.all(instances.value.map(inst => updateInstanceStatus(inst.instanceInfo.id)));
    }

    async function createInstance(creationInfo: Omit<ServerConfig, "id">) {
        const newServer = await mcServerConfigManager.createServer(creationInfo);

        if (newServer) {
            const {id, manager, config} = newServer;
            const newInstance: InstanceState = {
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

    async function deleteInstance(id: number) {
        await mcServerConfigManager.deleteServer(id);
        instances.value = instances.value.filter(instance => instance.instanceInfo.id !== id);
    }

    async function startInstance(id: number) {
        const instance = findInstance(id);
        if (instance && instance.processState.status === 'stopped') {
            instance.processState.status = 'starting';
            await instance.serverManager.start();
            await updateInstanceStatus(id);
        }
    }

    async function stopInstance(id: number, playerListStore: any) {
        const instance = findInstance(id);
        if (instance && instance.processState.status === 'running') {
            instance.processState.status = 'stopping';
            await instance.serverManager.stop();
            await updateInstanceStatus(id);
            playerListStore.removeAllPlayers(id)
        }
    }

    async function sendCommandToInstance(id: number, command: string) {
        const instance = findInstance(id);
        if (instance && instance.processState.status === 'running') {
            await instance.serverManager.sendCommand(command);
        }
    }

    async function updateInstanceStatus(id: number) {
        const instance = findInstance(id);
        if (instance) {
            const status = await instance.serverManager.getStatus();
            if (status) {
                instance.processState.status = 'running';
                instance.processState.cpu.push({
                    value: status.cpu,
                    time: new Date().toLocaleTimeString(),
                });
                instance.processState.memory.push({
                    value: status.memory,
                    time: new Date().toLocaleTimeString(),
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

        subscribeToOutput,
        unsubscribeFromOutput,
        initializeStore,
        createInstance,
        deleteInstance,
        startInstance,
        stopInstance,
        sendCommandToInstance,
        updateInstanceStatus,
    };
});