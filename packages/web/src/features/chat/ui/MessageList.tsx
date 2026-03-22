'use client';

import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '../model/chat.store';

interface Props {
    currentUserId: string;
    onReact: (messageId: string, emoji: string) => void;
    onDelete: (messageId: string) => void;
}

export function MessageList({ currentUserId, onReact, onDelete }: Props) {
    const { messages, typingUsers, isLoading } = useChatStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slack-green border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto py-2">
            {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
                    아직 메시지가 없습니다. 첫 번째 메시지를 보내보세요!
                </div>
            )}
            {messages.map((msg) => (
                <MessageItem
                    key={msg.id}
                    message={msg}
                    currentUserId={currentUserId}
                    onReact={onReact}
                    onDelete={onDelete}
                />
            ))}
            <TypingIndicator users={typingUsers} />
            <div ref={bottomRef} />
        </div>
    );
}
