import { getAppOrigin, getStartUrl, isAllowedUrl } from './config';

describe('desktop config', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.SLACORD_DESKTOP_START_URL;
        delete process.env.SLACORD_APP_URL;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('데스크톱 시작 URL 환경변수를 우선 사용함', () => {
        process.env.SLACORD_DESKTOP_START_URL = 'https://slacord.cloud/dashboard';

        expect(getStartUrl()).toBe('https://slacord.cloud/dashboard');
        expect(getAppOrigin()).toBe('https://slacord.cloud');
    });

    it('허용된 호스트만 true를 반환함', () => {
        expect(isAllowedUrl('https://slacord.cloud/auth/login')).toBe(true);
        expect(isAllowedUrl('https://malicious.example.com')).toBe(false);
        expect(isAllowedUrl('not-a-url')).toBe(false);
    });
});
