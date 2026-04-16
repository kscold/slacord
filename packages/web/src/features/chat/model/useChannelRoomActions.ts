'use client';

import { useEffect, useState } from 'react';
import { messageApi } from '@/lib/api-client';
import type { Message } from '@/src/entities/message/types';
import { getChatSocket } from './socket';
import { uploadChannelFiles } from './uploadChannelFiles';

interface ChatActionStore {
    addMessage: (message: Message) => void;
    prependMessages: (messages: Message[]) => void;
    updateMessage: (id: string, patch: Partial<Message>) => void;
    removeMessage: (id: string) => void;
}

interface Props {
    teamId: string;
    channelId: string;
    currentUserId: string;
    initialMessageCount: number;
    messages: Message[];
    addMessage: ChatActionStore['addMessage'];
    prependMessages: ChatActionStore['prependMessages'];
    updateMessage: ChatActionStore['updateMessage'];
    removeMessage: ChatActionStore['removeMessage'];
}

const HISTORY_PAGE_SIZE = 50;

function matchesOutgoingMessage(
    message: Message,
    payload: { content?: string; attachments?: Message['attachments']; replyToId?: string },
    currentUserId: string,
) {
    if (currentUserId && message.authorId !== currentUserId) return false;
    if ((message.replyToId ?? null) !== (payload.replyToId ?? null)) return false;

    const outgoingAttachments = payload.attachments ?? [];
    if (outgoingAttachments.length > 0) {
        if (message.attachments.length !== outgoingAttachments.length) return false;
        return outgoingAttachments.every((attachment) =>
            message.attachments.some((item) => item.url === attachment.url),
        );
    }

    return message.content === (payload.content ?? '');
}

async function waitForPersistedMessage(
    channelId: string,
    payload: { content?: string; attachments?: Message['attachments']; replyToId?: string },
    currentUserId: string,
) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await messageApi.getMessages(channelId, undefined, 20);
        if (response.success && Array.isArray(response.data)) {
            const match = (response.data as Message[]).find((message) =>
                matchesOutgoingMessage(message, payload, currentUserId),
            );
            if (match) return match;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return null;
}

async function waitForSocketConnection(socket: ReturnType<typeof getChatSocket>) {
    if (socket.connected) return;

    await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off('connect', handleConnect);
            socket.off('connect_error', handleError);
            reject(new Error('채팅 소켓 연결이 지연되고 있습니다.'));
        }, 5000);

        const handleConnect = () => {
            clearTimeout(timer);
            socket.off('connect', handleConnect);
            socket.off('connect_error', handleError);
            resolve();
        };

        const handleError = (error: Error) => {
            clearTimeout(timer);
            socket.off('connect', handleConnect);
            socket.off('connect_error', handleError);
            reject(error);
        };

        socket.on('connect', handleConnect);
        socket.on('connect_error', handleError);
    });
}

export function useChannelRoomActions({
    teamId,
    channelId,
    currentUserId,
    initialMessageCount,
    messages,
    addMessage,
    prependMessages,
    updateMessage,
    removeMessage,
}: Props) {
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [hasOlderMessages, setHasOlderMessages] = useState(initialMessageCount >= HISTORY_PAGE_SIZE);

    useEffect(() => {
        setIsLoadingOlder(false);
        setHasOlderMessages(initialMessageCount >= HISTORY_PAGE_SIZE);
    }, [channelId, initialMessageCount]);

    const emitMessage = async (payload: {
        content?: string;
        attachments?: Message['attachments'];
        replyToId?: string;
    }) => {
        const socket = getChatSocket();
        await waitForSocketConnection(socket);
        const nextMessage = new Promise<Message | null>((resolve) => {
            const timer = setTimeout(() => {
                socket.off('new_message', handleNewMessage);
                resolve(null);
            }, 1200);

            const handleNewMessage = (message: Message) => {
                if (!matchesOutgoingMessage(message, payload, currentUserId)) return;
                clearTimeout(timer);
                socket.off('new_message', handleNewMessage);
                resolve(message);
            };

            socket.on('new_message', handleNewMessage);
        });

        socket.emit('send_message', { teamId, channelId, ...payload });

        const broadcastMessage = await nextMessage;
        const persistedMessage = broadcastMessage ?? (await waitForPersistedMessage(channelId, payload, currentUserId));

        if (!persistedMessage) {
            throw new Error('메시지를 전송하지 못했습니다.');
        }
        addMessage(persistedMessage);
        return persistedMessage;
    };

    const loadOlderMessages = async () => {
        if (isLoadingOlder || !hasOlderMessages) return false;

        const oldestMessage = messages[0];
        if (!oldestMessage?.createdAt) {
            setHasOlderMessages(false);
            return false;
        }

        setIsLoadingOlder(true);

        try {
            const response = await messageApi.getMessages(channelId, oldestMessage.createdAt, HISTORY_PAGE_SIZE);
            const existingMessageIds = new Set(messages.map((message) => message.id));
            const olderMessages = ((response.data ?? []) as Message[]).filter(
                (message) => !existingMessageIds.has(message.id),
            );

            if (olderMessages.length > 0) {
                prependMessages(olderMessages);
            }

            setHasOlderMessages(((response.data ?? []) as Message[]).length >= HISTORY_PAGE_SIZE);
            return olderMessages.length > 0;
        } finally {
            setIsLoadingOlder(false);
        }
    };

    return {
        hasOlderMessages,
        isUploading,
        isLoadingOlder,
        loadOlderMessages,
        sendMessage: async (content: string, replyToId?: string) => {
            await emitMessage({ content, replyToId });
        },
        sendAttachments: async (files: File[], content: string, replyToId?: string) => {
            setIsUploading(true);
            try {
                const attachments = await uploadChannelFiles(channelId, teamId, files);
                await emitMessage({ content, attachments, replyToId });
            } finally {
                setIsUploading(false);
            }
        },
        sendTyping: () => getChatSocket().emit('typing', { channelId }),
        reactToMessage: (messageId: string, emoji: string) =>
            getChatSocket().emit('add_reaction', { messageId, channelId, emoji }),
        deleteMessage: (messageId: string) => {
            removeMessage(messageId);
            void messageApi.deleteMessage(channelId, messageId);
        },
        editMessage: async (messageId: string, content: string) => {
            const response = await messageApi.editMessage(channelId, messageId, content);
            if (response.success && response.data) {
                updateMessage(messageId, response.data as Message);
            }
        },
        togglePinMessage: async (message: Message) => {
            const response = await messageApi.pinMessage(channelId, message.id, !message.isPinned);
            if (response.success && response.data) {
                updateMessage(message.id, response.data as Message);
            }
            return response.data as Message;
        },
    };
}
