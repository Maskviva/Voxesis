export function formatOnlineTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = '';
    if (days > 0) {
        result += `${days}d `;
    }
    if (hours > 0) {
        result += `${hours}h `;
    }
    if (minutes > 0) {
        result += `${minutes}m `;
    }
    if (seconds > 0 && days === 0) {
        // 只有在没有天数的情况下才显示秒数
        result += `${seconds}s`;
    }

    // 如果结果为空，则显示0m
    return result.trim() || '0m';
}

export function formatDurationFromTimestamp(timestamp: number): string {
    const totalSeconds = Math.floor(timestamp / 1000);
    const years = Math.floor(totalSeconds / (365 * 24 * 3600));
    const days = Math.floor((totalSeconds % (365 * 24 * 3600)) / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = '';
    if (years > 0) {
        result += `${years}y`;
    }
    if (days > 0) {
        result += `${days}d`;
    }
    if (hours > 0) {
        result += `${hours}h`;
    }
    if (minutes > 0) {
        result += `${minutes}m`;
    }
    if (seconds > 0) {
        result += `${seconds}s`;
    }

    return result || '0s';
}
