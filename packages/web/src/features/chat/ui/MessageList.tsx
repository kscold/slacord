'use client';

import { useMemo } from 'react';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '../model/chat.store';
import { useStickyScroll } from '../model/stickyScroll';

interface Props {
    currentUserId: string;
    onReact: (messageId: string, emoji: string) => void;
    onDelete: (messageId: string) => void;
    onEdit: (messageId: string, content: string) => Promise<void>;
    onOpenThread: (message: import('@/src/entities/message/types').Message) => void;
    onTogglePin: (message: import('@/src/entities/message/types').Message) => Promise<unknown>;
}

export function MessageList({ currentUserId, onReact, onDelete, onEdit, onOpenThread, onTogglePin }: Props) {
    const { messages, typingUsers, isLoading } = useChatStore();

    // 스레드 답글 수를 로컬 store에서 실시간 계산
    const replyCountMap = useMemo(() => {
        const map = new Map<string, number>();
        for (const msg of messages) {
            if (msg.replyToId) {
                map.set(msg.replyToId, (map.get(msg.replyToId) ?? 0) + 1);
            }
        }
        return map;
    }, [messages]);

    // 메인 메시지에 실시간 replyCount 반영
    const mainMessages = useMemo(
        () =>
            messages
                .filter((msg) => !msg.replyToId)
                .map((msg) => {
                    const liveCount = replyCountMap.get(msg.id) ?? 0;
                    const serverCount = msg.replyCount ?? 0;
                    const count = Math.max(liveCount, serverCount);
                    return count !== (msg.replyCount ?? 0) ? { ...msg, replyCount: count } : msg;
                }),
        [messages, replyCountMap],
    );
    const mainMessageIds = useMemo(() => mainMessages.map((message) => message.id), [mainMessages]);
    const { bottomRef, containerRef, handleScroll, scrollToBottom, showJumpToLatest } = useStickyScroll({
        itemIds: mainMessageIds,
    });

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slack-green border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="relative flex-1">
            <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto py-2">
                {mainMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
                        아직 메시지가 없습니다. 첫 번째 메시지를 보내보세요!
                    </div>
                )}
                {mainMessages.map((msg) => (
                    <MessageItem
                        key={msg.id}
                        message={msg}
                        currentUserId={currentUserId}
                        onReact={onReact}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onOpenThread={onOpenThread}
                        onTogglePin={onTogglePin}
                    />
                ))}
                <TypingIndicator users={typingUsers} />
                <div ref={bottomRef} />
            </div>
            {showJumpToLatest && (
                <button
                    type="button"
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 rounded-full border border-brand-400/40 bg-bg-secondary/95 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/30 backdrop-blur transition hover:border-brand-300 hover:bg-bg-secondary"
                >
                    최신 메시지로 이동
                </button>
            )}
        </div>
    );
}
