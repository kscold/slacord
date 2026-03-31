'use client';

import { useEffect, type MutableRefObject } from 'react';
import type { Message } from '@/src/entities/message/types';
import { getChatSocket } from './socket';
import { notifyIncomingMessage } from './notifyIncomingMessage';

interface ChatSocketActions {
    addMessage: (message: Message) => void;
    updateMessage: (id: string, patch: Partial<Message>) => void;
    removeMessage: (id: string) => void;
    setTypingUsers: (users: string[]) => void;
}

interface Props {
    channelId: string;
    channelLabelRef: MutableRefObject<string>;
    currentUserIdRef: MutableRefObject<string>;
    addMessage: ChatSocketActions['addMessage'];
    updateMessage: ChatSocketActions['updateMessage'];
    removeMessage: ChatSocketActions['removeMessage'];
    setTypingUsers: ChatSocketActions['setTypingUsers'];
}

export function useChannelRoomSocket({
    channelId,
    channelLabelRef,
    currentUserIdRef,
    addMessage,
    updateMessage,
    removeMessage,
    setTypingUsers,
}: Props) {
    useEffect(() => {
        const socket = getChatSocket();
        const typingMap = new Map<string, { label: string; timer: ReturnType<typeof setTimeout> }>();

        const syncTypingUsers = () => {
            setTypingUsers([...typingMap.values()].map((value) => value.label));
        };

        const handleTyping = ({ userId, username }: { userId: string; username?: string }) => {
            if (userId === currentUserIdRef.current) return;
            const previous = typingMap.get(userId);
            if (previous) clearTimeout(previous.timer);

            typingMap.set(userId, {
                label: username || '동료',
                timer: setTimeout(() => {
                    typingMap.delete(userId);
                    syncTypingUsers();
                }, 2500),
            });

            syncTypingUsers();
        };

        const handleNewMessage = (message: Message) => {
            addMessage(message);
            void notifyIncomingMessage(message, channelLabelRef.current, currentUserIdRef.current);
        };

        const handleReactionUpdated = (message: Message) => updateMessage(message.id, message);
        const handlePinnedUpdated = (message: Message) => updateMessage(message.id, message);
        const handleMessageDeleted = ({ messageId }: { messageId: string }) => removeMessage(messageId);

        socket.emit('join_channel', { channelId });
        socket.on('new_message', handleNewMessage);
        socket.on('reaction_updated', handleReactionUpdated);
        socket.on('pinned_message_updated', handlePinnedUpdated);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('user_typing', handleTyping);

        return () => {
            typingMap.forEach((entry) => clearTimeout(entry.timer));
            socket.emit('leave_channel', { channelId });
            socket.off('new_message', handleNewMessage);
            socket.off('reaction_updated', handleReactionUpdated);
            socket.off('pinned_message_updated', handlePinnedUpdated);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('user_typing', handleTyping);
        };
    }, [addMessage, channelId, currentUserIdRef, channelLabelRef, removeMessage, setTypingUsers, updateMessage]);
}
