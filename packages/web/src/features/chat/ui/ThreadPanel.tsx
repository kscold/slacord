'use client';

import { useEffect, useMemo, useState } from 'react';
import { messageApi } from '@/lib/api-client';
import type { Message } from '@/src/entities/message/types';
import { useChatStore } from '../model/chat.store';
import { MessageInput } from './MessageInput';

interface Props {
    channelId: string;
    parentMessage: Message;
    onClose: () => void;
    onSendReply: (content: string, replyToId: string) => void;
    onUploadReply: (files: File[], content: string, replyToId: string) => Promise<void>;
    isUploading: boolean;
}

export function ThreadPanel({ channelId, parentMessage, onClose, onSendReply, onUploadReply, isUploading }: Props) {
    const liveReplies = useChatStore((state) => state.messages.filter((message) => message.replyToId === parentMessage.id));
    const [replies, setReplies] = useState<Message[]>([]);
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

    return (
        <aside className="fixed inset-0 z-50 flex flex-col bg-bg-secondary lg:static lg:z-auto lg:w-96 lg:border-l lg:border-border-primary">
            <div className="flex items-center justify-between border-b border-border-primary px-4 py-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#d6b08a]">Thread</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">스레드</h3>
                </div>
                <button onClick={onClose} className="text-sm text-text-tertiary hover:text-white">닫기</button>
            </div>
            <div className="space-y-4 p-4">
                <div className="rounded-2xl border border-border-primary bg-bg-primary p-3">
                    <p className="text-sm font-medium text-white">{parentMessage.authorName || parentMessage.authorId}</p>
                    <p className="mt-2 text-sm text-text-secondary">{parentMessage.content}</p>
                </div>
                <div className="space-y-3">
                    {mergedReplies.map((reply) => (
                        <div key={reply.id} className="rounded-2xl border border-border-primary bg-black/10 p-3">
                            <p className="text-sm font-medium text-white">{reply.authorName || reply.authorId}</p>
                            <p className="mt-2 text-sm text-text-secondary">{reply.content}</p>
                        </div>
                    ))}
                    {mergedReplies.length === 0 && <p className="text-sm text-text-tertiary">아직 답글이 없습니다.</p>}
                </div>
            </div>
            <MessageInput
                channelName="thread"
                onSend={(content) => onSendReply(content, parentMessage.id)}
                onUpload={(files, content) => onUploadReply(files, content, parentMessage.id)}
                onTyping={() => {}}
                isUploading={isUploading}
            />
        </aside>
    );
}
