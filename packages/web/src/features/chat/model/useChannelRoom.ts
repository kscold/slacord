'use client';

import { useChatStore } from './chat.store';
import { useChannelRoomActions } from './useChannelRoomActions';
import { useChannelRoomBootstrap } from './useChannelRoomBootstrap';
import { useChannelRoomSocket } from './useChannelRoomSocket';

export function useChannelRoom(teamId: string, channelId: string) {
    const { setMessages, addMessage, updateMessage, removeMessage, setTypingUsers, setLoading, reset } = useChatStore();
    const room = useChannelRoomBootstrap({ teamId, channelId, reset, setLoading, setMessages });
    const actions = useChannelRoomActions({ teamId, channelId, updateMessage, removeMessage });

    useChannelRoomSocket({
        channelId,
        channelLabelRef: room.channelLabelRef,
        currentUserIdRef: room.currentUserIdRef,
        addMessage,
        updateMessage,
        removeMessage,
        setTypingUsers,
    });

    return {
        channel: room.channel,
        channelLabel: room.channelLabel,
        members: room.members,
        currentUserId: room.currentUser?.id ?? '',
        ...actions,
    };
}
