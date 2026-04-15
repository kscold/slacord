import {
    HUDDLE_RECOVERY_FAILED_MESSAGE,
    HUDDLE_RECOVERY_MESSAGE,
    isHuddleRecoveryMessage,
    nextHuddleRecoveryDelay,
    shouldInitiateHuddleRecovery,
} from './recovery';

describe('huddle recovery helpers', () => {
    it('사용자 id 기준으로 한쪽만 재협상을 시작하게 한다', () => {
        expect(shouldInitiateHuddleRecovery('user-1', 'user-2')).toBe(true);
        expect(shouldInitiateHuddleRecovery('user-9', 'user-2')).toBe(false);
    });

    it('재시도 횟수에 따라 backoff delay를 계산한다', () => {
        expect(nextHuddleRecoveryDelay(1)).toBe(300);
        expect(nextHuddleRecoveryDelay(2)).toBe(1000);
        expect(nextHuddleRecoveryDelay(3)).toBe(1700);
    });

    it('허들 네트워크 복구 메시지를 구분한다', () => {
        expect(isHuddleRecoveryMessage(HUDDLE_RECOVERY_MESSAGE)).toBe(true);
        expect(isHuddleRecoveryMessage(HUDDLE_RECOVERY_FAILED_MESSAGE)).toBe(true);
        expect(isHuddleRecoveryMessage('다른 에러')).toBe(false);
    });
});
