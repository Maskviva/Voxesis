import {defineStore} from "pinia";
import {SystemState} from "../../../bindings/voxesis/src/Common/Entity";
import {reactive} from "vue";
import {GetSystemState} from "../../api/utils";

/**
 * 系统状态轮询函数
 * @param callback
 * @param time
 */
function listenSystemState(callback: (state: Promise<SystemState | null>) => void, time: number = 1000) {
    setInterval(() => {
        callback(GetSystemState())
    }, time)
}

/**
 * 系统状态存储
 */
export const useSystemStateStore = defineStore("systemState", () => {
    const systemStates = reactive<SystemState[]>([])

    /**
     * 监听系统状态
     * @constructor
     */
    async function ListenState() {
        listenSystemState(async (state) => {
            systemStates.push(await state)
        })
    }

    return {
        systemStates,
        ListenState
    }
})