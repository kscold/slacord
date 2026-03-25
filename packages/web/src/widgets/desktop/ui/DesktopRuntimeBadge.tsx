'use client';

import type { DesktopUpdateStage } from '@slacord/contracts';
import { useEffect, useState } from 'react';

const LABELS: Record<Exclude<DesktopUpdateStage, 'idle'>, string> = {
    checking: '업데이트 확인 중',
    available: '새 버전이 준비됐어요',
    downloading: '업데이트 다운로드 중',
    downloaded: '업데이트 준비 완료',
    installing: '업데이트 설치 중',
    error: '업데이트 적용 실패',
};

export function DesktopRuntimeBadge() {
    const [detail, setDetail] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [stage, setStage] = useState<DesktopUpdateStage>('idle');

    useEffect(() => {
        if (!window.slacordDesktop?.isDesktop) return;
        void window.slacordDesktop.getUpdateStatus().then((payload) => {
            setStage(payload.stage);
            setDetail(payload.detail);
        });
        return window.slacordDesktop.onUpdateStatus((payload) => {
            setStage(payload.stage);
            setDetail(payload.detail);
            if (payload.stage !== 'downloaded') setInstalling(false);
            if (payload.stage !== 'downloading') setDownloading(false);
        });
    }, []);

    if (typeof window === 'undefined' || !window.slacordDesktop?.isDesktop || !stage || stage === 'idle') return null;

    const handleDownload = async () => {
        if (downloading || !window.slacordDesktop || typeof window.slacordDesktop.downloadUpdate !== 'function') return;
        setDownloading(true);
        const result = await window.slacordDesktop.downloadUpdate();
        setStage(result.status.stage);
        setDetail(result.status.detail);
        if (!result.ok) setDownloading(false);
    };

    const handleRestart = async () => {
        if (installing || !window.slacordDesktop || typeof window.slacordDesktop.restartToUpdate !== 'function') return;
        setInstalling(true);
        const result = await window.slacordDesktop.restartToUpdate();
        setStage(result.status.stage);
        setDetail(result.status.detail);
        if (!result.ok) setInstalling(false);
    };

    const showManualLink =
        detail.includes('다운로드 페이지') ||
        detail.includes('수동 다운로드') ||
        detail.includes('수동 업데이트');

    return (
        <div className="fixed right-4 top-4 z-[90] flex items-center gap-3 rounded-full border border-brand-400/30 bg-black/75 px-4 py-2 text-xs text-white shadow-lg backdrop-blur-md">
            <div>
                <span className="font-semibold text-brand-200">{LABELS[stage as Exclude<DesktopUpdateStage, 'idle'>] || 'Desktop status'}</span>
                {detail ? <span className="ml-2 text-text-secondary">{detail}</span> : null}
            </div>
            {stage === 'available' && typeof window.slacordDesktop?.downloadUpdate === 'function' ? (
                <button
                    onClick={() => void handleDownload()}
                    className="rounded-full bg-[#b97532] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#cf8640] disabled:cursor-wait disabled:opacity-70"
                    disabled={downloading}
                >
                    {downloading ? '다운로드 준비 중' : '업데이트 받기'}
                </button>
            ) : null}
            {stage === 'downloaded' && typeof window.slacordDesktop?.restartToUpdate === 'function' ? (
                <button onClick={() => void handleRestart()} className="rounded-full bg-[#b97532] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#cf8640] disabled:cursor-wait disabled:opacity-70" disabled={installing}>
                    {installing ? '재시작 준비 중' : '지금 재시작'}
                </button>
            ) : null}
            {(stage === 'available' || stage === 'error') && showManualLink ? (
                <a href="/download" className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                    수동 다운로드
                </a>
            ) : null}
        </div>
    );
}
