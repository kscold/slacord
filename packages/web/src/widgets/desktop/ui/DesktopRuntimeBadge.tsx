'use client';

import type { DesktopUpdateStage } from '@slacord/contracts';
import { useEffect, useState } from 'react';

const LABELS: Record<Exclude<DesktopUpdateStage, 'idle'>, string> = {
    checking: '업데이트 확인 중',
    available: '업데이트 다운로드 시작',
    downloading: '업데이트 다운로드 중',
    downloaded: '업데이트 준비 완료',
    error: '업데이트 확인 실패',
};

export function DesktopRuntimeBadge() {
    const [detail, setDetail] = useState('');
    const [stage, setStage] = useState<DesktopUpdateStage>('idle');

    useEffect(() => {
        if (!window.slacordDesktop?.isDesktop) return;
        return window.slacordDesktop.onUpdateStatus((payload) => {
            setStage(payload.stage);
            setDetail(payload.detail);
        });
    }, []);

    if (typeof window === 'undefined' || !window.slacordDesktop?.isDesktop || !stage || stage === 'idle') return null;

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-[90] rounded-full border border-brand-400/30 bg-black/75 px-4 py-2 text-xs text-white shadow-lg backdrop-blur-md">
            <span className="font-semibold text-brand-200">{LABELS[stage as Exclude<DesktopUpdateStage, 'idle'>] || 'Desktop status'}</span>
            {detail ? <span className="ml-2 text-text-secondary">{detail}</span> : null}
        </div>
    );
}
