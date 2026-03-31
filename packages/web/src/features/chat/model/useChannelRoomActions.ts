'use client';

import { useState } from 'react';
import { messageApi } from '@/lib/api-client';
import type { Message } from '@/src/entities/message/types';
import { getChatSocket } from './socket';
import { uploadChannelFiles } from './uploadChannelFiles';

interface ChatActionStore {
    updateMessage: (id: string, patch: Partial<Message>) => void;
    removeMessage: (id: string) => void;
}

interface Props {
    teamId: string;
    channelId: string;
    updateMessage: ChatActionStore['updateMessage'];
    removeMessage: ChatActionStore['removeMessage'];
}

export function useChannelRoomActions({ teamId, channelId, updateMessage, removeMessage }: Props) {
    const [isUploading, setIsUploading] = useState(false);

    return {
        isUploading,
        sendMessage: (content: string, replyToId?: string) => {
            getChatSocket().emit('send_message', { teamId, channelId, content, replyToId });
        },
        sendAttachments: async (files: File[], content: string, replyToId?: string) => {
            setIsUploading(true);
            try {
                const attachments = await uploadChannelFiles(channelId, teamId, files);
                getChatSocket().emit('send_message', { teamId, channelId, content, attachments, replyToId });
            } finally {
                setIsUploading(false);
            }
        },
        sendTyping: () => getChatSocket().emit('typing', { channelId }),
        reactToMessage: (messageId: string, emoji: string) => getChatSocket().emit('add_reaction', { messageId, channelId, emoji }),
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
