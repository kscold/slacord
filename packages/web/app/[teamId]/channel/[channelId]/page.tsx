'use client';

import { useEffect, useCallback } from 'react';
import { use } from 'react';
import { MessageList } from '@/src/features/chat/ui/MessageList';
import { MessageInput } from '@/src/features/chat/ui/MessageInput';
import { useChatStore } from '@/src/features/chat/model/chat.store';
import { getChatSocket } from '@/src/features/chat/model/socket';
import { messageApi } from '@/lib/api-client';
import type { Message } from '@/src/entities/message/types';

interface Props {
    params: Promise<{ teamId: string; channelId: string }>;
}

const CURRENT_USER_ID = 'me'; // TODO: 실제 인증 사용자 ID로 교체

export default function ChannelPage({ params }: Props) {
    const { teamId, channelId } = use(params);
    const { setMessages, addMessage, updateMessage, removeMessage, setTypingUsers, setLoading, reset } = useChatStore();

    useEffect(() => {
        reset();
        setLoading(true);

        // 히스토리 로드
        messageApi.getMessages(channelId).then((res) => {
            if (res.success && Array.isArray(res.data)) {
                setMessages(res.data as Message[]);
            }
            setLoading(false);
        }).catch(() => setLoading(false));

        // 소켓 연결 (토큰은 쿠키에 있으므로 임시로 빈 문자열 사용)
        const socket = getChatSocket('');
        socket.emit('join_channel', { channelId, teamId });

        socket.on('new_message', (msg: Message) => addMessage(msg));
        socket.on('message_edited', (msg: Message) => updateMessage(msg.id, msg));
        socket.on('message_deleted', ({ messageId }: { messageId: string }) => removeMessage(messageId));
        socket.on('reaction_updated', (msg: Message) => updateMessage(msg.id, msg));
        socket.on('typing', ({ userId }: { userId: string }) => {
            setTypingUsers([userId]);
            setTimeout(() => setTypingUsers([]), 3000);
        });

        return () => {
            socket.emit('leave_channel', { channelId });
            socket.off('new_message');
            socket.off('message_edited');
            socket.off('message_deleted');
            socket.off('reaction_updated');
            socket.off('typing');
        };
    }, [channelId, teamId]);

    const handleSend = useCallback((content: string) => {
        const socket = getChatSocket('');
        socket.emit('send_message', { channelId, teamId, content, authorId: CURRENT_USER_ID });
    }, [channelId, teamId]);

    const handleTyping = useCallback(() => {
        const socket = getChatSocket('');
        socket.emit('typing', { channelId, userId: CURRENT_USER_ID });
    }, [channelId]);

    const handleReact = useCallback((messageId: string, emoji: string) => {
        const socket = getChatSocket('');
        socket.emit('add_reaction', { messageId, channelId, userId: CURRENT_USER_ID, emoji });
    }, [channelId]);

    const handleDelete = useCallback((messageId: string) => {
        messageApi.deleteMessage(channelId, messageId);
    }, [channelId]);

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-border-primary">
                <h2 className="font-semibold text-white">채널</h2>
            </div>
            <MessageList
                currentUserId={CURRENT_USER_ID}
                onReact={handleReact}
                onDelete={handleDelete}
            />
            <MessageInput channelName="채널" onSend={handleSend} onTyping={handleTyping} />
        </div>
    );
}
