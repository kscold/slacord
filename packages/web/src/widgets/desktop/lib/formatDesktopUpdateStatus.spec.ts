import type { DesktopUpdateStatus } from '@slacord/contracts';
import { formatDesktopUpdateStatus } from './formatDesktopUpdateStatus';

function makeStatus(overrides: Partial<DesktopUpdateStatus>): DesktopUpdateStatus {
    return {
        stage: 'checking',
        detail: '',
        progress: null,
        availableVersion: null,
        manualDownloadRequired: false,
        ...overrides,
    };
}

describe('formatDesktopUpdateStatus', () => {
    it('다운로드 중이면 퍼센트와 안내 문구를 함께 보여줌', () => {
        const result = formatDesktopUpdateStatus(makeStatus({
            stage: 'downloading',
            progress: 0.54,
            detail: '원본 상세',
        }));

        expect(result.title).toBe('업데이트를 내려받는 중이에요');
        expect(result.progress).toBe('54%');
        expect(result.detail).toBe('지금 54%까지 받았어요.');
    });

    it('진행률이 없으면 원본 상세를 유지함', () => {
        const result = formatDesktopUpdateStatus(makeStatus({
            stage: 'available',
            detail: '설치할 버전이 있어요.',
        }));

        expect(result.title).toBe('업데이트가 준비됐어요');
        expect(result.detail).toBe('설치할 버전이 있어요.');
        expect(result.progress).toBe('');
    });

    it('mac 수동 설치 상태면 수동 설치 안내를 우선 보여줌', () => {
        const result = formatDesktopUpdateStatus(makeStatus({
            stage: 'error',
            detail: '',
            manualDownloadRequired: true,
        }), 'darwin');

        expect(result.title).toBe('새 설치 파일로 업데이트해 주세요');
        expect(result.detail).toContain('다운로드 페이지에서 최신 DMG를 다시 설치');
    });
});
