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
    onClose: () => void;
    onSendReply: (content: string, replyToId: string) => void;
    onUploadReply: (files: File[], content: string, replyToId: string) => Promise<void>;
    isUploading: boolean;
}

function ThreadMessage({ msg }: { msg: Message }) {
    const authorLabel = msg.authorName || msg.authorId.slice(-6);
    const time = new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex gap-2.5 px-4 py-2">
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
        </div>
    );
}

export function ThreadPanel({ channelId, parentMessage, onClose, onSendReply, onUploadReply, isUploading }: Props) {
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
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-border-primary px-4 py-3 shrink-0">
                <h3 className="text-base font-bold text-white">스레드</h3>
                <button onClick={onClose} className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-hover hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto">
                {/* 원본 메시지 */}
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

                {/* 답글 목록 */}
                <div className="py-1">
                    {mergedReplies.map((reply) => (
                        <ThreadMessage key={reply.id} msg={reply} />
                    ))}
                    {mergedReplies.length === 0 && <p className="px-4 py-8 text-center text-sm text-text-tertiary">아직 답글이 없습니다.</p>}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* 입력 */}
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
