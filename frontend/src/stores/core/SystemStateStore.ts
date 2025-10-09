import {defineStore} from "pinia";
import {GetSystemState} from "../../../bindings/voxesis/src/Communication/InterProcess/utilsipc";
import {SystemState} from "../../../bindings/voxesis/src/Common/Entity";
import {reactive} from "vue";

function listenSystemState(callback: (state: Promise<SystemState | null>) => void) {
    setInterval(() => {
        callback(GetSystemState())
    }, 1000)
}

export const useSystemStateStore = defineStore("systemState", () => {
    const systemStates = reactive<SystemState[]>([])

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