'use client';

import type { DesktopUpdateStatus } from '@slacord/contracts';
import { useEffect, useMemo, useState } from 'react';
import { formatDesktopUpdateStatus } from '../lib/formatDesktopUpdateStatus';

const IDLE_STATUS: DesktopUpdateStatus = {
    stage: 'idle',
    detail: '',
    progress: null,
    availableVersion: null,
    manualDownloadRequired: false,
};

export function useDesktopRuntimeBadge() {
    const [status, setStatus] = useState<DesktopUpdateStatus>(IDLE_STATUS);
    const [downloading, setDownloading] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        if (!window.slacordDesktop?.isDesktop) return;
        void window.slacordDesktop.getUpdateStatus().then(setStatus);
        return window.slacordDesktop.onUpdateStatus((nextStatus) => {
            setStatus(nextStatus);
            if (nextStatus.stage !== 'downloaded') setInstalling(false);
            if (nextStatus.stage !== 'downloading') setDownloading(false);
        });
    }, []);

    const formatted = useMemo(() => formatDesktopUpdateStatus(status), [status]);
    const isVisible = typeof window !== 'undefined' && !!window.slacordDesktop?.isDesktop && status.stage !== 'idle';

    return {
        status,
        formatted,
        isVisible,
        downloading,
        installing,
        setStatus,
        setDownloading,
        setInstalling,
    };
}
