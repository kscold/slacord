'use client';

import { useEffect, useRef, useState } from 'react';
import { authApi, channelApi, messageApi, teamApi } from '@/lib/api-client';
import { resolveChannelLabel } from '@/src/entities/channel/lib/resolveChannelLabel';
import type { Channel } from '@/src/entities/channel/types';
import type { Message } from '@/src/entities/message/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import type { User } from '@/src/entities/user/types';
import { useChatStore } from './chat.store';
import { getChatSocket } from './socket';
import { notifyIncomingMessage } from './notifyIncomingMessage';
import { uploadChannelFiles } from './uploadChannelFiles';

export function useChannelRoom(teamId: string, channelId: string) {
    const { setMessages, addMessage, updateMessage, removeMessage, setTypingUsers, setLoading, reset } = useChatStore();
    const [channel, setChannel] = useState<Channel | null>(null);
    const [channelLabel, setChannelLabel] = useState('general');
    const channelLabelRef = useRef('general');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [members, setMembers] = useState<TeamMemberSummary[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const currentUserId = useRef('');
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        let active = true;
        reset();
        setLoading(true);
        Promise.all([authApi.getMe(), messageApi.getMessages(channelId), channelApi.getChannels(teamId), teamApi.getMembers(teamId)])
            .then(([meRes, messageRes, channelRes, memberRes]) => {
                if (!active) return;
                if (meRes.success && meRes.data) {
                    const user = meRes.data as User;
                    currentUserId.current = user.id;
                    setCurrentUser(user);
                }
                if (messageRes.success && Array.isArray(messageRes.data)) {
                    setMessages(messageRes.data as Message[]);
                }
                const teamMembers = memberRes.success && Array.isArray(memberRes.data) ? memberRes.data as TeamMemberSummary[] : [];
                setMembers(teamMembers);
                if (channelRes.success && Array.isArray(channelRes.data)) {
                    const activeChannel = (channelRes.data as Channel[]).find((item) => item.id === channelId) ?? null;
                    setChannel(activeChannel);
                    const label = activeChannel ? resolveChannelLabel(activeChannel, teamMembers, currentUserId.current) : 'general';
                    setChannelLabel(label);
                    channelLabelRef.current = label;
                }
            })
            .finally(() => active && setLoading(false));
        const socket = getChatSocket();
        const typingMap = new Map<string, { label: string; timer: ReturnType<typeof setTimeout> }>();
        const syncTypingUsers = () => setTypingUsers([...typingMap.values()].map((v) => v.label));
        const handleTyping = ({ userId, username }: { userId: string; username?: string }) => {
            if (userId === currentUserId.current) return;
            const prev = typingMap.get(userId);
            if (prev) clearTimeout(prev.timer);
            typingMap.set(userId, {
                label: username || '동료',
                timer: setTimeout(() => { typingMap.delete(userId); syncTypingUsers(); }, 2500),
            });
            syncTypingUsers();
        };
        const handleNewMessage = (message: Message) => {
            addMessage(message);
            void notifyIncomingMessage(message, channelLabelRef.current, currentUserId.current);
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
            active = false;
            socket.emit('leave_channel', { channelId });
            socket.off('new_message', handleNewMessage);
            socket.off('reaction_updated', handleReactionUpdated);
            socket.off('pinned_message_updated', handlePinnedUpdated);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('user_typing', handleTyping);
        };
    }, [addMessage, channelId, removeMessage, reset, setLoading, setMessages, setTypingUsers, teamId, updateMessage]);

    return {
        channel,
        channelLabel,
        members,
        isUploading,
        currentUserId: currentUser?.id ?? '',
        sendMessage: (content: string, replyToId?: string) => getChatSocket().emit('send_message', { teamId, channelId, content, replyToId }),
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
            messageApi.deleteMessage(channelId, messageId);
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
