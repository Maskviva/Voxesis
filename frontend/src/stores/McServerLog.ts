import {ref, shallowRef} from 'vue'
import {McServerLogOutput} from "./PlayerList";
import {AnsiUp} from "ansi_up";
import {Events} from "@wailsio/runtime"

interface Log {
    content: string; // 日志内容
    fullMessage?: string; // 完整消息
    raw: string; // 原始日志行
}

export const mc_logs = ref<Log[]>([]);

export const IsLeviLamina = shallowRef(false)

// 移除ANSI转义字符
export const removeAnsiCodes = (text: string): string => text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");

const ansiConverter = new AnsiUp();

const createLogParser = () => {

    function Parser(logText: string): Log[] {
        let ReturnValve

        if (IsLeviLamina.value) {
            const logStr = removeExePathStr(logText)

            ReturnValve = [{
                content: ansiConverter.ansi_to_html(logStr),
                fullMessage: logStr,
                raw: logStr
            }] as Log[]
        } else {
            const lines = logText.split(/\r?\n/);
            ReturnValve = lines.map(line => NativeLogParser(line)).filter((log): log is Log => log !== null);
        }

        return ReturnValve
    }

    return (logText: string): Log[] => {
        return Parser(logText)
    };
};

function removeExePathStr(str: string) {
    let processedLine = str;

    const titleEscapeIndex = processedLine.indexOf(']0;');
    if (titleEscapeIndex !== -1) {
        const nextEscapeIndex = processedLine.indexOf('\x1b', titleEscapeIndex + 3);
        if (nextEscapeIndex !== -1) {
            processedLine = processedLine.substring(0, titleEscapeIndex) + processedLine.substring(nextEscapeIndex + 1);
        } else {
            const afterTitle = processedLine.substring(titleEscapeIndex + 3);
            const firstBracketIndex = afterTitle.indexOf('[');
            if (firstBracketIndex !== -1) {
                processedLine = afterTitle.substring(firstBracketIndex);
            }
        }
    }
    return processedLine
}

function NativeLogParser(line: string): Log | null {
    let processedLine = line;

    processedLine = removeExePathStr(processedLine)

    const cleanedLine = removeAnsiCodes(processedLine).trim();
    if (!cleanedLine) return null;

    const match = cleanedLine.match(
        /^\[(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2}):(\d{3}) (\w+)](.*)$/
    );

    if (!match) {
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

        const content = `\x1b[38;5;103m[${time}] \x1b[0m${cleanedLine}`

        return {
            content: ansiConverter.ansi_to_html(content),
            raw: line
        };
    }

    const [, _date, hours, minutes, seconds, ms, level, message] = match;
    const displayMessage = message.trim().length > 120 ?
        `${message.trim().substring(0, 120)}...` : message.trim();

    const levelANSI = level == 'INFO' ? '\x1b[38;5;85m' : level == 'WARN' ? '\x1b[93m' : level == 'ERROR' ? '\x1b[38;5;203m' : '';

    const content = `\x1b[38;5;103m[${hours}:${minutes}:${seconds}.${ms}] ${levelANSI}[${level}] \x1b[0m${displayMessage}`

    return {
        content: ansiConverter.ansi_to_html(content),
        fullMessage: message,
        raw: line
    };
}

const parseLogLine = createLogParser();

Events.On("mc_server_terminal_output", (log: { data: string[] }) => {
    let logText: string = log.data.join();

    const parsedLogs = parseLogLine(logText);
    if (parsedLogs.length > 0) {
        mc_logs.value.push(...parsedLogs);
        parsedLogs.forEach(parsedLog => {
            McServerLogOutput(parsedLog.raw)
        });
    }
});
