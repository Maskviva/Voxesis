import {ref} from "vue";
import Avatar1 from '../assets/images/Avatar1.avif';
import Avatar2 from '../assets/images/Avatar2.avif';
import Avatar3 from '../assets/images/Avatar3.avif';
import Avatar4 from '../assets/images/Avatar4.avif';
import Avatar5 from '../assets/images/Avatar5.avif';
import Avatar6 from '../assets/images/Avatar6.avif';
import {IsLeviLamina, removeAnsiCodes} from "./McServerLog";
import {GetAppConfigByKey} from "../../bindings/voxesis/src/ipc/configipc";
import {SendMessageToLLOneBot} from "../../bindings/voxesis/src/ipc/utilsipc";

interface Player {
    id: number;
    name: string;
    xuid: string;
    joinTime: number;
    avatarUrl: string;
}

const PLAYER_JOIN_REGEX = /\[(.*?) INFO] Player Spawned: (.*?) xuid: ([a-zA-Z0-9]+)/;
const PLAYER_LEAVE_REGEX = /\[(.*?) INFO] Player disconnected: (.*?), xuid: ([a-zA-Z0-9]+)/;

const LEVILAMINA_PLAYER_JOIN_REGEX = /(.*?) INFO \[Server] Player Spawned: (.*?) xuid: ([a-zA-Z0-9]+)/;
const LEVILAMINA_PLAYER_LEAVE_REGEX = /(.*?) INFO \[Server] Player disconnected: (.*?), xuid: ([a-zA-Z0-9]+)/;

export const PlayerList = ref<Player[]>([])

const AvatarUrlList = [
    Avatar1,
    Avatar2,
    Avatar3,
    Avatar4,
    Avatar5,
    Avatar6,
]

function parseLogMessage(logMessage: string) {
    // 尝试匹配玩家加入
    let match = IsLeviLamina.value ? LEVILAMINA_PLAYER_JOIN_REGEX.exec(removeAnsiCodes(logMessage)) : PLAYER_JOIN_REGEX.exec(logMessage);
    if (match) {
        const [, timestamp, playerName, xuid] = match;
        console.log(timestamp, playerName, xuid);

        return {
            type: 'PlayerJoin',
            timestamp,
            playerName,
            xuid
        };
    }

    // 尝试匹配玩家离开
    match = IsLeviLamina.value ? LEVILAMINA_PLAYER_LEAVE_REGEX.exec(removeAnsiCodes(logMessage)) : PLAYER_LEAVE_REGEX.exec(logMessage);
    if (match) {
        const [, timestamp, playerName, xuid] = match;
        console.log(timestamp, playerName, xuid);

        return {
            type: 'PlayerLeave',
            timestamp,
            playerName,
            xuid
        };
    }

    // 如果没有任何模式匹配成功
    return {
        type: 'Unknown',
        rawLog: logMessage,
    };
}

export function McServerLogOutput(logMessage: string) {
    const LogMessage = parseLogMessage(logMessage);

    if (LogMessage.type === 'PlayerJoin') {
        addPlayer(LogMessage.playerName!, LogMessage.xuid!);
    } else if (LogMessage.type === 'PlayerLeave') {
        removePlayer(LogMessage.playerName!, LogMessage.xuid!);
    }
}

// 获取认证令牌
function addPlayer(playerName: string, playerXuid: string) {
    PlayerList.value.push({
        id: PlayerList.value.length + 1,
        name: playerName,
        xuid: playerXuid,
        joinTime: Date.now(),
        avatarUrl: AvatarUrlList[Math.floor(Math.random() * AvatarUrlList.length)]
    })

    GetAppConfigByKey("qq_bot").then(data => {
        if (!data) return;

        SendMessageToLLOneBot(`玩家 ${playerName} 加入了服务器`)
    })
}

function removePlayer(playerName: string, playerXuid: string) {
    const index = PlayerList.value.findIndex((player: Player) =>
        player.name === playerName && player.xuid === playerXuid
    );

    if (index !== -1) {
        PlayerList.value.splice(index, 1);

        // 重新分配ID，使其连续
        for (let i = 0; i < PlayerList.value.length; i++) {
            PlayerList.value[i].id = i + 1;
        }
    }

    GetAppConfigByKey("qq_bot").then(data => {
        if (!data) return;

        SendMessageToLLOneBot(`玩家 ${playerName} 退出了服务器`)
    })
}
