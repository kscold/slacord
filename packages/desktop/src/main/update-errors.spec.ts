import { normalizeUpdateError, shouldFallbackToManualDownload } from './update-errors';

describe('update-errors', () => {
    const originalPlatform = process.platform;

    afterEach(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('mac 서명 검증 실패는 수동 다운로드 fallback으로 판단함', () => {
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        const error = new Error('Code signature at URL did not pass validation');

        expect(shouldFallbackToManualDownload(error)).toBe(true);
        expect(normalizeUpdateError(error)).toBe('macOS 서명 검증을 통과하지 못했어요. 다운로드 페이지에서 새 버전을 다시 설치해 주세요.');
    });

    it('일반 오류는 원본 메시지를 유지함', () => {
        Object.defineProperty(process, 'platform', { value: 'win32' });
        const error = new Error('업데이트 서버에 연결하지 못했어요.');

        expect(shouldFallbackToManualDownload(error)).toBe(false);
        expect(normalizeUpdateError(error)).toBe('업데이트 서버에 연결하지 못했어요.');
    });
});
