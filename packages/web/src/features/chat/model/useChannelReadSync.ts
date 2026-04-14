'use client';

import { useCallback, useEffect, useRef } from 'react';
import { channelApi } from '@/lib/api-client';
import { emitWorkspaceChannelRead } from '@/src/features/workspace/model/channelReadEvents';

interface Props {
    channelId: string;
    canMarkRead: boolean;
    latestMessageId: string | null;
}

export function useChannelReadSync({ channelId, canMarkRead, latestMessageId }: Props) {
    const lastMarkedKeyRef = useRef('');
    const inFlightKeyRef = useRef('');

    useEffect(() => {
        lastMarkedKeyRef.current = '';
        inFlightKeyRef.current = '';
    }, [channelId]);

    const markAsRead = useCallback(async () => {
        if (!canMarkRead || typeof document === 'undefined' || document.visibilityState === 'hidden') return;

        const nextKey = latestMessageId ?? `empty:${channelId}`;
        if (lastMarkedKeyRef.current === nextKey || inFlightKeyRef.current === nextKey) return;

        inFlightKeyRef.current = nextKey;

        try {
            const response = await channelApi.markChannelRead(channelId);
            if (response.success && response.data) {
                const payload = response.data as { channelId: string; lastReadAt: string };
                lastMarkedKeyRef.current = nextKey;
                emitWorkspaceChannelRead({
                    channelId: payload.channelId,
                    lastReadAt: payload.lastReadAt,
                });
            }
        } finally {
            if (inFlightKeyRef.current === nextKey) {
                inFlightKeyRef.current = '';
            }
        }
    }, [canMarkRead, channelId, latestMessageId]);

    useEffect(() => {
        void markAsRead();

        const handleVisibility = () => {
            if (document.visibilityState !== 'hidden') {
                void markAsRead();
            }
        };

        window.addEventListener('focus', handleVisibility);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('focus', handleVisibility);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [markAsRead]);
}
