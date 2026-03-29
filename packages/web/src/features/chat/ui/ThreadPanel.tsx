'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { messageApi } from '@/lib/api-client';
import type { Message } from '@/src/entities/message/types';
import { getAvatarColor } from '@/src/shared/lib/avatar';
import { useChatStore } from '../model/chat.store';
import { MessageInput } from './MessageInput';

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

function ThreadMessage({ msg, canDelete, onDelete }: { msg: Message; canDelete: boolean; onDelete?: (id: string) => void }) {
    const authorLabel = msg.authorName || msg.authorId.slice(-6);
    const time = new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="group relative flex gap-2.5 px-4 py-2 hover:bg-white/[0.03]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: getAvatarColor(msg.authorId) }}>
                {authorLabel.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-bold text-white">{authorLabel}</span>
                    <span className="text-[11px] text-text-tertiary">{time}</span>
                </div>
                {msg.content && <p className="mt-0.5 text-[14px] text-white/90 leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>}
            </div>
            {canDelete && onDelete && (
                <button
                    onClick={() => onDelete(msg.id)}
                    className="absolute right-2 top-1 hidden group-hover:flex items-center rounded-md border border-border-primary bg-bg-secondary px-1.5 py-1 text-text-tertiary shadow-md hover:bg-red-500/10 hover:text-red-400 transition-colors z-10"
                    title="삭제"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            )}
        </div>
    );
}

export function ThreadPanel({ channelId, parentMessage, currentUserId, onClose, onSendReply, onUploadReply, onDelete, isUploading }: Props) {
    const allMessages = useChatStore((state) => state.messages);
    const liveReplies = useMemo(() => allMessages.filter((m) => m.replyToId === parentMessage.id), [allMessages, parentMessage.id]);
    const [replies, setReplies] = useState<Message[]>([]);
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

    const parentAuthor = parentMessage.authorName || parentMessage.authorId.slice(-6);
    const parentTime = new Date(parentMessage.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

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
                    <div className="flex gap-2.5 px-4 pt-4">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: getAvatarColor(parentMessage.authorId) }}>
                            {parentAuthor.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-[13px] font-bold text-white">{parentAuthor}</span>
                                <span className="text-[11px] text-text-tertiary">{parentTime}</span>
                            </div>
                            {parentMessage.content && <p className="mt-0.5 text-[14px] text-white/90 leading-relaxed break-words whitespace-pre-wrap">{parentMessage.content}</p>}
                        </div>
                    </div>
                    {mergedReplies.length > 0 && (
                        <p className="mt-3 px-4 text-[12px] text-text-tertiary">{mergedReplies.length}개의 답글</p>
                    )}
                </div>

                <div className="py-1">
                    {mergedReplies.map((reply) => (
                        <ThreadMessage key={reply.id} msg={reply} canDelete={true} onDelete={onDelete} />
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
