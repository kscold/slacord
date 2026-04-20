'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { channelApi, unwrapApiArray } from '@/lib/api-client';
import { getNotificationSocket, getWorkspaceChatSocket } from '@/lib/socket';
import type { Channel } from '@/src/entities/channel/types';
import type { Message } from '@/src/entities/message/types';
import { applyChannelRead, applyUnreadMessage } from '@/src/entities/channel/lib/syncChannelActivity';
import { workspaceChannelReadEvent, type WorkspaceChannelReadDetail } from './channelReadEvents';

interface Props {
    teamId: string;
    initialChannels: Channel[];
    currentUserId: string;
    activeChannelId: string | null;
}

export function useWorkspaceChannels({ teamId, initialChannels, currentUserId, activeChannelId }: Props) {
    const [channels, setChannels] = useState(initialChannels);
    const channelIds = useMemo(() => channels.map((channel) => channel.id), [channels]);
    const channelIdsKey = channelIds.join(',');

    const refresh = useCallback(async () => {
        const response = await channelApi.getChannels(teamId);
        const list = unwrapApiArray<Channel>(response);
        if (list.length > 0) setChannels(list);
    }, [teamId]);

    useEffect(() => {
        setChannels(initialChannels);
    }, [initialChannels]);

    useEffect(() => {
        if (!currentUserId) return;
        void refresh();
    }, [currentUserId, refresh]);

    useEffect(() => {
        const handleRead = (event: Event) => {
            const detail = (event as CustomEvent<WorkspaceChannelReadDetail>).detail;
            if (!detail) return;
            setChannels((current) => applyChannelRead(current, detail));
        };

        window.addEventListener(workspaceChannelReadEvent, handleRead as EventListener);
        return () => window.removeEventListener(workspaceChannelReadEvent, handleRead as EventListener);
    }, []);

    useEffect(() => {
        if (!currentUserId || channelIds.length === 0) return;
        const socket = getWorkspaceChatSocket();
        const joinedChannelIds = channelIdsKey.split(',').filter(Boolean);

        joinedChannelIds.forEach((channelId) => socket.emit('join_channel', { channelId }));

        const handleNewMessage = (message: Message) => {
            setChannels((current) =>
                applyUnreadMessage(current, {
                    message,
                    currentUserId,
                    activeChannelId,
                    isVisible: document.visibilityState !== 'hidden',
                }),
            );
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            joinedChannelIds.forEach((channelId) => socket.emit('leave_channel', { channelId }));
            socket.off('new_message', handleNewMessage);
        };
    }, [activeChannelId, channelIds.length, channelIdsKey, currentUserId]);

    useEffect(() => {
        if (!currentUserId) return;

        const handleRefresh = () => {
            if (document.visibilityState === 'hidden') return;
            void refresh();
        };

        window.addEventListener('focus', handleRefresh);
        document.addEventListener('visibilitychange', handleRefresh);

        return () => {
            window.removeEventListener('focus', handleRefresh);
            document.removeEventListener('visibilitychange', handleRefresh);
        };
    }, [currentUserId, refresh]);

    useEffect(() => {
        if (!currentUserId) return;

        const interval = window.setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            void refresh();
        }, 2500);

        return () => window.clearInterval(interval);
    }, [currentUserId, refresh]);

    useEffect(() => {
        if (!currentUserId) return;

        const socket = getNotificationSocket();
        const joinRoom = () => socket.emit('join_team_notifications', { teamId });
        const handleNotificationChange = () => {
            void refresh();
        };

        joinRoom();
        socket.on('connect', joinRoom);
        socket.on('notification:new', handleNotificationChange);
        socket.on('notification:read', handleNotificationChange);
        socket.on('notification:read_all', handleNotificationChange);

        return () => {
            socket.emit('leave_team_notifications', { teamId });
            socket.off('connect', joinRoom);
            socket.off('notification:new', handleNotificationChange);
            socket.off('notification:read', handleNotificationChange);
            socket.off('notification:read_all', handleNotificationChange);
        };
    }, [currentUserId, refresh, teamId]);

    return { channels, refresh };
}
