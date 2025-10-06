import {
    DelValueOfKey,
    GetAllValue,
    GetValueOfKey,
    NewConfigManager,
    SetValueOfKey
} from "../../bindings/voxesis/src/Communication/InterProcess/configipc"
import {ConfigType} from "../../bindings/voxesis/src/Common/Manager";

export class AppConfig {
    private uuid: string;

    constructor() {
        this.uuid = "";
    }

    async Create() {
        return NewConfigManager(ConfigType.$JSON, "./config/app.config.json", false).then(([uuid, err]) => {
            if (err) {
                throw new Error("NewConfigManager error:" + err);
            } else {
                this.uuid = uuid!;
            }
        })
    }

    GetAllValue() {
        return GetAllValue(this.uuid);
    }

    async GetValueOfKey(key: string) {
        const [value, err] = await GetValueOfKey(this.uuid, key, "")

        if (err) {
            throw new Error("GetValueOfKey error:" + err);
        }

        return value!;
    }

    async SetValueOfKey(key: string, value: any) {
        const err = await SetValueOfKey(this.uuid, key, value, "")

        if (err) {
            throw new Error("SetValueOfKey error:" + err);
        }

        return true;
    }

    async DelValueOfKey(key: string) {
        const err = await DelValueOfKey(this.uuid, key)

        if (err) {
            throw new Error("DelValueOfKey error:" + err);
        }

        return true;
    }

}