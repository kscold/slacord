import type { DesktopUpdateStage, DesktopUpdateStatus } from '@slacord/contracts';

const TITLES: Record<Exclude<DesktopUpdateStage, 'idle'>, string> = {
    checking: '새 버전을 확인하고 있어요',
    available: '업데이트가 준비됐어요',
    downloading: '업데이트를 내려받는 중이에요',
    downloaded: '재시작하면 바로 적용돼요',
    installing: '업데이트를 적용하고 있어요',
    error: '업데이트를 마치지 못했어요',
};

export function formatDesktopUpdateStatus(status: DesktopUpdateStatus) {
    const progress = status.progress !== null && status.progress !== undefined
        ? `${Math.round(status.progress * 100)}%`
        : '';

    const detail = status.stage === 'downloading' && progress
        ? `지금 ${progress}까지 받았어요.`
        : status.detail;

    return {
        title: TITLES[status.stage as Exclude<DesktopUpdateStage, 'idle'>] || 'Desktop status',
        detail,
        progress,
    };
}
