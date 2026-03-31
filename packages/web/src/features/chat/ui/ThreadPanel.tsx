'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { messageApi } from '@/lib/api-client';
import type { Message } from '@/src/entities/message/types';
import { getAvatarColor } from '@/src/shared/lib/avatar';
import { useChatStore } from '../model/chat.store';
import { MessageInput } from './MessageInput';
import { ThreadMessageItem } from './ThreadMessageItem';
import { ThreadParentMessage } from './ThreadParentMessage';

interface Props {
    channelId: string;
    parentMessage: Message;
    currentUserId: string;
    onClose: () => void;
    onSendReply: (content: string, replyToId: string) => void;
    onUploadReply: (files: File[], content: string, replyToId: string) => Promise<void>;
    onDelete: (messageId: string) => void;
    isUploading: boolean;
}

export function ThreadPanel({ channelId, parentMessage, currentUserId, onClose, onSendReply, onUploadReply, onDelete, isUploading }: Props) {
    const allMessages = useChatStore((state) => state.messages);
    const liveReplies = useMemo(() => allMessages.filter((m) => m.replyToId === parentMessage.id), [allMessages, parentMessage.id]);
    const [replies, setReplies] = useState<Message[]>([]);
    const [expandedDeleteId, setExpandedDeleteId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const mergedReplies = useMemo(() => {
        const map = new Map<string, Message>();
        [...replies, ...liveReplies].forEach((message) => map.set(message.id, message));
        return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }, [liveReplies, replies]);

    useEffect(() => {
        messageApi.getThreadMessages(channelId, parentMessage.id).then((response) => {
            if (response.success && Array.isArray(response.data)) {
                setReplies(response.data as Message[]);
            }
        });
    }, [channelId, parentMessage.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mergedReplies]);

    return (
        <aside className="fixed inset-0 z-50 flex flex-col bg-bg-primary lg:static lg:z-auto lg:w-96 lg:border-l lg:border-border-primary">
            <div className="flex items-center justify-between border-b border-border-primary px-4 py-3 shrink-0">
                <h3 className="text-base font-bold text-white">스레드</h3>
                <button onClick={onClose} className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-hover hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="border-b border-border-primary pb-3">
                    <ThreadParentMessage message={parentMessage} />
                    {mergedReplies.length > 0 && (
                        <p className="mt-3 px-4 text-[12px] text-text-tertiary">{mergedReplies.length}개의 답글</p>
                    )}
                </div>

                <div className="py-1">
                    {mergedReplies.map((reply) => (
                        <ThreadMessageItem
                            key={reply.id}
                            canDelete={reply.authorId === currentUserId}
                            message={reply}
                            onDelete={onDelete}
                            onToggleDelete={() => setExpandedDeleteId((current) => current === reply.id ? null : reply.id)}
                            showDeleteButton={expandedDeleteId === reply.id}
                        />
                    ))}
                    {mergedReplies.length === 0 && <p className="px-4 py-8 text-center text-sm text-text-tertiary">아직 답글이 없습니다.</p>}
                    <div ref={bottomRef} />
                </div>
            </div>

            <MessageInput
                channelName="스레드"
                onSend={(content) => onSendReply(content, parentMessage.id)}
                onUpload={(files, content) => onUploadReply(files, content, parentMessage.id)}
                onTyping={() => {}}
                isUploading={isUploading}
            />
        </aside>
    );
}
