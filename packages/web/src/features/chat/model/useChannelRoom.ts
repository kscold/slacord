'use client';

import { hasTeamWriteAccess, resolveCurrentTeamMember } from '@/src/entities/team/lib/access';
import { useChatStore } from './chat.store';
import { useChannelRoomActions } from './useChannelRoomActions';
import { useChannelRoomBootstrap } from './useChannelRoomBootstrap';
import { useChannelReadSync } from './useChannelReadSync';
import { useChannelRoomSocket } from './useChannelRoomSocket';

export function useChannelRoom(teamId: string, channelId: string) {
    const {
        setMessages,
        addMessage,
        prependMessages,
        updateMessage,
        removeMessage,
        setTypingUsers,
        setLoading,
        reset,
    } = useChatStore();
    const messages = useChatStore((state) => state.messages);
    const isLoading = useChatStore((state) => state.isLoading);
    const room = useChannelRoomBootstrap({ teamId, channelId, reset, setLoading, setMessages });
    const actions = useChannelRoomActions({
        teamId,
        channelId,
        currentUserId: room.currentUser?.id ?? '',
        initialMessageCount: room.initialMessageCount,
        messages,
        addMessage,
        prependMessages,
        updateMessage,
        removeMessage,
    });
    const latestMessageId = messages[messages.length - 1]?.id ?? null;

    useChannelRoomSocket({
        channelId,
        channelLabelRef: room.channelLabelRef,
        currentUserIdRef: room.currentUserIdRef,
        addMessage,
        updateMessage,
        removeMessage,
        setTypingUsers,
    });

    useChannelReadSync({
        channelId,
        canMarkRead: Boolean(room.currentUser?.id) && !isLoading,
        latestMessageId,
    });

    const currentMember = resolveCurrentTeamMember(room.members, room.currentUser?.id ?? '');

    return {
        channel: room.channel,
        channelLabel: room.channelLabel,
        canWrite: hasTeamWriteAccess(currentMember?.role),
        members: room.members,
        currentUserId: room.currentUser?.id ?? '',
        currentUsername: room.currentUser?.username ?? '',
        ...actions,
    };
}
