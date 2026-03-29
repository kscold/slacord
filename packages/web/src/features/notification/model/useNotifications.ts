'use client';

import { useCallback, useEffect, useState } from 'react';
import { notificationApi } from '@/lib/api-client';
import type { AppNotification } from '@/src/entities/notification/types';

export function useNotifications(teamId: string) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        const [listRes, countRes] = await Promise.all([
            notificationApi.getNotifications(teamId),
            notificationApi.getUnreadCount(teamId),
        ]);
        if (listRes.success && Array.isArray(listRes.data)) setNotifications(listRes.data as AppNotification[]);
        if (countRes.success && countRes.data) setUnreadCount((countRes.data as { count: number }).count);
    }, [teamId]);

    useEffect(() => {
        setLoading(true);
        load().finally(() => setLoading(false));
        // 30초마다 폴링
        const interval = setInterval(() => void load(), 30000);
        return () => clearInterval(interval);
    }, [load]);

    const markAsRead = async (id: string) => {
        await notificationApi.markAsRead(teamId, id);
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
    };

    const markAllAsRead = async () => {
        await notificationApi.markAllAsRead(teamId);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: load };
}
