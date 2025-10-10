import {defineStore} from "pinia";
import {reactive, readonly, toRefs} from "vue";

import Avatar1 from '../../assets/images/Avatar1.avif';
import Avatar2 from '../../assets/images/Avatar2.avif';
import Avatar3 from '../../assets/images/Avatar3.avif';
import Avatar4 from '../../assets/images/Avatar4.avif';
import Avatar5 from '../../assets/images/Avatar5.avif';
import Avatar6 from '../../assets/images/Avatar6.avif';

export const AVATAR_URLS = [
    Avatar1,
    Avatar2,
    Avatar3,
    Avatar4,
    Avatar5,
    Avatar6
];

export interface Player {
    name: string;
    uid: string;
    joinTime: number;
    avatarUrl: string;
}

interface ServerPlayers {
    [serverId: string]: Player[];
}

enum PlayerAction {
    JOIN = 'JOIN',
    LEAVE = 'LEAVE',
}

interface LogMatcher {
    regex: RegExp;
    action: PlayerAction;
}

const removeAnsiCodes = (text: string): string =>
    text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");

const getRandomAvatar = (): string =>
    AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];

const LOG_MATCHERS: LogMatcher[] = [
    {
        regex: /.*?Player Spawned: (.*?) xuid: ([a-zA-Z0-9]+)/,
        action: PlayerAction.JOIN
    },
    {
        regex: /.*?Player disconnected: (.*?) xuid: ([a-zA-Z0-9]+)/,
        action: PlayerAction.LEAVE
    },
];

export const usePlayerListStore = defineStore('playerList', () => {
    const state = reactive<{
        servers: ServerPlayers;
    }>({
        servers: {},
    });

    const ensureServerExists = (serverId: number): void => {
        if (!state.servers[serverId]) {
            state.servers[serverId] = [];
        }
    };

    const findPlayerIndex = (serverId: number, uid: string): number => {
        const serverPlayers = state.servers[serverId];
        return serverPlayers ? serverPlayers.findIndex(p => p.uid === uid) : -1;
    };

    const addPlayer = (serverId: number, playerName: string, uid: string): void => {
        ensureServerExists(serverId);

        if (findPlayerIndex(serverId, uid) !== -1) return;

        const newPlayer: Player = {
            name: playerName,
            uid,
            joinTime: Date.now(),
            avatarUrl: getRandomAvatar(),
        };

        state.servers[serverId].push(newPlayer);
    };

    const removePlayer = (serverId: number, uid: string): void => {
        const playerIndex = findPlayerIndex(serverId, uid);
        if (playerIndex === -1) return;

        state.servers[serverId].splice(playerIndex, 1);
    };

    const parseLogMessage = (serverId: number, logMessage: string): void => {
        const cleanedLog = removeAnsiCodes(logMessage);

        for (const matcher of LOG_MATCHERS) {
            const match = matcher.regex.exec(cleanedLog);

            if (!match) continue;

            const [, playerName, uid] = match;

            switch (matcher.action) {
                case PlayerAction.JOIN:
                    addPlayer(serverId, playerName, uid);
                    break;
                case PlayerAction.LEAVE:
                    removePlayer(serverId, uid);
                    break;
            }
            return;
        }
    };

    const getServerPlayers = (serverId: number): Player[] =>
        state.servers[serverId] || [];

    const getAllPlayers = (): Player[] =>
        Object.values(state.servers).flat();

    const removeAllPlayers = (serverId: number): void => {
        state.servers[serverId] = [];
    };

    return {
        ...toRefs(readonly(state)),
        parseLogMessage,
        getServerPlayers,
        getAllPlayers,
        removeAllPlayers,
    };
});