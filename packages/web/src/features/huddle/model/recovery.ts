export const HUDDLE_RECOVERY_MESSAGE = '허들 연결이 불안정합니다. 다시 연결하는 중입니다.';
export const HUDDLE_RECOVERY_FAILED_MESSAGE = '허들 연결을 복구하지 못했습니다. TURN 서버 또는 네트워크 설정을 확인해주세요.';
export const MAX_HUDDLE_RECOVERY_ATTEMPTS = 3;

export function shouldInitiateHuddleRecovery(currentUserId: string, targetUserId: string) {
    return currentUserId.localeCompare(targetUserId) <= 0;
}

export function nextHuddleRecoveryDelay(attempt: number) {
    const normalizedAttempt = Math.max(1, Math.trunc(attempt));
    return 300 + (normalizedAttempt - 1) * 700;
}

export function isHuddleRecoveryMessage(value: string | null | undefined) {
    return value === HUDDLE_RECOVERY_MESSAGE || value === HUDDLE_RECOVERY_FAILED_MESSAGE;
}
