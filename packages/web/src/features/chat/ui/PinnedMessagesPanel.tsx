'use client';

import { useEffect, useState } from 'react';
import { messageApi } from '@/lib/api-client';
import type { Message } from '@/src/entities/message/types';

interface Props {
    channelId: string;
    onClose: () => void;
    onOpenThread: (message: Message) => void;
    onTogglePin: (message: Message) => Promise<unknown>;
}

export function PinnedMessagesPanel({ channelId, onClose, onOpenThread, onTogglePin }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        messageApi.getPinnedMessages(channelId).then((response) => {
            if (response.success && Array.isArray(response.data)) {
                setMessages(response.data as Message[]);
            }
        });
    }, [channelId]);

    return (
        <aside className="fixed inset-0 z-50 flex flex-col bg-bg-secondary lg:static lg:z-auto lg:w-80 lg:border-l lg:border-border-primary">
            <div className="flex items-center justify-between border-b border-border-primary px-4 py-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#d6b08a]">Pinned</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">고정 메시지</h3>
                </div>
                <button onClick={onClose} className="text-sm text-text-tertiary hover:text-white">닫기</button>
            </div>
            <div className="space-y-3 p-4">
                {messages.length === 0 && <p className="text-sm text-text-tertiary">고정된 메시지가 없습니다.</p>}
                {messages.map((message) => (
                    <div key={message.id} className="rounded-2xl border border-border-primary bg-bg-primary p-3">
                        <p className="text-sm font-medium text-white">{message.authorName || message.authorId}</p>
                        <p className="mt-2 text-sm text-text-secondary">{message.content}</p>
                        <div className="mt-3 flex gap-2">
                            <button onClick={() => onOpenThread(message)} className="text-xs text-slack-green">스레드</button>
                            <button onClick={async () => { await onTogglePin(message); setMessages((current) => current.filter((item) => item.id !== message.id)); }} className="text-xs text-text-tertiary hover:text-white">
                                해제
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}
