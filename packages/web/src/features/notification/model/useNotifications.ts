'use client';

import { useCallback, useEffect, useState } from 'react';
import { notificationApi } from '@/lib/api-client';
import type { AppNotification } from '@/src/entities/notification/types';
import { getNotificationSocket } from '@/lib/socket';
import {
    applyNotificationRead,
    applyNotificationReadAll,
    prependNotification,
} from '@/src/entities/notification/lib/syncNotifications';

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
        const socket = getNotificationSocket();

        const joinRoom = () => socket.emit('join_team_notifications', { teamId });
        const handleNewNotification = (notification: AppNotification) => {
            setNotifications((prev) => prependNotification(prev, notification));
            setUnreadCount((count) => count + (notification.isRead ? 0 : 1));
        };
        const handleReadNotification = ({ id }: { id: string }) => {
            setNotifications((prev) => applyNotificationRead(prev, id));
            setUnreadCount((count) => Math.max(0, count - 1));
        };
        const handleReadAll = () => {
            setNotifications((prev) => applyNotificationReadAll(prev));
            setUnreadCount(0);
        };

        joinRoom();
        socket.on('connect', joinRoom);
        socket.on('notification:new', handleNewNotification);
        socket.on('notification:read', handleReadNotification);
        socket.on('notification:read_all', handleReadAll);

        return () => {
            socket.emit('leave_team_notifications', { teamId });
            socket.off('connect', joinRoom);
            socket.off('notification:new', handleNewNotification);
            socket.off('notification:read', handleReadNotification);
            socket.off('notification:read_all', handleReadAll);
        };
    }, [load]);

    const markAsRead = async (id: string) => {
        await notificationApi.markAsRead(teamId, id);
        if (!getNotificationSocket().connected) {
            setNotifications((prev) => applyNotificationRead(prev, id));
            setUnreadCount((count) => Math.max(0, count - 1));
        }
    };

    const markAllAsRead = async () => {
        await notificationApi.markAllAsRead(teamId);
        if (!getNotificationSocket().connected) {
            setNotifications((prev) => applyNotificationReadAll(prev));
            setUnreadCount(0);
        }
    };

    return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: load };
}
