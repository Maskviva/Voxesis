import {defineStore} from 'pinia'
import {ref} from 'vue'
import {mcServerConfigManager, mcServerManager} from '../instance/mcServerInstanceManager'

export interface Instance {
    name: string
    path: string
    abs: boolean
    conPty: boolean
    args: string[]
    outputEventName: string
    status?: any
}

export const useInstanceStore = defineStore('instance', () => {
    const manager = new mcServerConfigManager()
    const instances = ref<Record<string, Instance>>({})
    const isInitialized = ref(false)

    async function initialize() {
        if (isInitialized.value) return
        try {
            await manager.create()
            await fetchAllInstances()
            isInitialized.value = true
        } catch (error) {
            console.error("初始化实例管理器失败:", error)
        }
    }

    async function fetchAllInstances() {
        const allServerData = await manager.GetAllServerData()
        const parsedInstances: Record<string, Instance> = {}
        if (allServerData) {
            for (const key in allServerData) {
                parsedInstances[key] = JSON.parse(allServerData[key])
            }
        }
        instances.value = parsedInstances
    }

    async function createInstance(newInstance: Omit<Instance, 'outputEventName'>) {
        const {name, path, abs, conPty, args} = newInstance
        manager.NewServer(name, path, abs, conPty, args)
        await fetchAllInstances()
    }

    async function deleteInstance(name: string) {
        await manager.DelServer(name)
        await fetchAllInstances()
    }

    async function getInstanceManager(name: string): Promise<mcServerManager | null> {
        return await manager.GetServer(name);
    }

    async function startInstance(name: string) {
        const serverManager = await getInstanceManager(name)
        serverManager?.Start()
    }

    async function stopInstance(name: string) {
        const serverManager = await getInstanceManager(name)
        serverManager?.Stop()
    }

    async function sendCommandToInstance(name: string, command: string) {
        const serverManager = await getInstanceManager(name)
        serverManager?.SendCommand(command)
    }

    async function getInstanceStatus(name: string) {
        const serverManager = await getInstanceManager(name)
        if (serverManager) {
            const [status, err] = await serverManager.GetStatus()
            if (err) {
                console.error(`获取实例 ${name} 状态失败:`, err)
                return null
            }
            return status
        }
        return null
    }

    return {
        instances,
        initialize,
        fetchAllInstances,
        createInstance,
        deleteInstance,
        startInstance,
        stopInstance,
        sendCommandToInstance,
        getInstanceStatus
    }
})