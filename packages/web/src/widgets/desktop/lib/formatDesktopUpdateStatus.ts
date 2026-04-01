import type { DesktopUpdateStage, DesktopUpdateStatus } from '@slacord/contracts';

const TITLES: Record<Exclude<DesktopUpdateStage, 'idle'>, string> = {
    checking: '새 버전을 확인하고 있어요',
    available: '업데이트가 준비됐어요',
    downloading: '업데이트를 내려받는 중이에요',
    downloaded: '재시작하면 바로 적용돼요',
    installing: '업데이트를 적용하고 있어요',
    error: '업데이트를 마치지 못했어요',
};

export function formatDesktopUpdateStatus(status: DesktopUpdateStatus, platform = '') {
    const progress = status.progress !== null && status.progress !== undefined
        ? `${Math.round(status.progress * 100)}%`
        : '';

    const title = status.manualDownloadRequired && platform === 'darwin'
        ? '새 설치 파일로 업데이트해 주세요'
        : TITLES[status.stage as Exclude<DesktopUpdateStage, 'idle'>] || 'Desktop status';

    const detail = status.manualDownloadRequired && platform === 'darwin'
        ? status.detail || 'macOS 앱 안 자동 업데이트는 잠시 보류 중이에요. 다운로드 페이지에서 최신 DMG를 다시 설치해 주세요.'
        : status.stage === 'downloading' && progress
        ? `지금 ${progress}까지 받았어요.`
        : status.detail;

    return {
        title,
        detail,
        progress,
    };
}
