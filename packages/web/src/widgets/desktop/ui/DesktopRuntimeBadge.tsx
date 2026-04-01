'use client';

import { useDesktopRuntimeBadge } from '../model/useDesktopRuntimeBadge';

export function DesktopRuntimeBadge() {
    const {
        status,
        formatted,
        isVisible,
        platform,
        downloading,
        installing,
        setStatus,
        setDownloading,
        setInstalling,
    } = useDesktopRuntimeBadge();

    const isMac = platform === 'darwin';

    if (!isVisible) return null;

    const handleDownload = async () => {
        if (downloading || !window.slacordDesktop || typeof window.slacordDesktop.downloadUpdate !== 'function') return;
        setDownloading(true);
        const result = await window.slacordDesktop.downloadUpdate();
        setStatus(result.status);
        if (!result.ok) setDownloading(false);
    };

    const handleRestart = async () => {
        if (installing || !window.slacordDesktop || typeof window.slacordDesktop.restartToUpdate !== 'function') return;
        setInstalling(true);
        const result = await window.slacordDesktop.restartToUpdate();
        setStatus(result.status);
        if (!result.ok) setInstalling(false);
    };

    return (
        <div className="fixed right-4 top-4 z-[90] w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-brand-400/20 bg-black/80 p-4 text-white shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-200">{formatted.title}</p>
                    {formatted.detail ? <p className="mt-1 text-xs leading-5 text-text-secondary">{formatted.detail}</p> : null}
                    {status.availableVersion ? <p className="mt-2 text-[11px] text-[#cdb79d]">대상 버전 v{status.availableVersion}</p> : null}
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#d8c4a8]">
                    {status.stage === 'downloading' && formatted.progress ? formatted.progress : 'Desktop'}
                </span>
            </div>
            {status.progress !== null && status.stage === 'downloading' ? (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-brand-400 transition-[width]" style={{ width: `${Math.max(6, Math.round(status.progress * 100))}%` }} />
                </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
                {status.stage === 'available' && !isMac && typeof window.slacordDesktop?.downloadUpdate === 'function' ? (
                    <button onClick={() => void handleDownload()} className="rounded-full bg-[#b97532] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#cf8640] disabled:cursor-wait disabled:opacity-70" disabled={downloading}>
                        {downloading ? '다운로드 준비 중' : '업데이트 받기'}
                    </button>
                ) : null}
                {status.stage === 'downloaded' && !isMac && typeof window.slacordDesktop?.restartToUpdate === 'function' ? (
                    <button onClick={() => void handleRestart()} className="rounded-full bg-[#b97532] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#cf8640] disabled:cursor-wait disabled:opacity-70" disabled={installing}>
                        {installing ? '재시작 준비 중' : '지금 재시작'}
                    </button>
                ) : null}
                {(status.stage === 'available' || status.stage === 'error' || status.manualDownloadRequired || isMac) ? (
                    <a href="/download" className="rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                        {isMac ? '최신 DMG 받기' : '설치 파일 다시 받기'}
                    </a>
                ) : null}
            </div>
        </div>
    );
}
