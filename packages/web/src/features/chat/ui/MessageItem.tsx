'use client';

import { ReactionBar } from './ReactionBar';
import { GitHubEventCard } from './GitHubEventCard';
import { MessageAttachments } from './MessageAttachments';
import { getAvatarColor } from '@/src/shared/lib/avatar';
import type { Message, GitHubEventMeta } from '@/src/entities/message/types';

interface Props {
    message: Message;
    currentUserId: string;
    onReact: (messageId: string, emoji: string) => void;
    onDelete?: (messageId: string) => void;
    onOpenThread?: (message: Message) => void;
    onTogglePin?: (message: Message) => Promise<unknown>;
}

function parseGitHubMeta(content: string): GitHubEventMeta | null {
    const match = content.match(/<!--github:(.+?)-->/);
    if (!match) return null;
    try {
        return JSON.parse(match[1]) as GitHubEventMeta;
    } catch {
        return null;
    }
}

export function MessageItem({ message, currentUserId, onReact, onDelete, onOpenThread, onTogglePin }: Props) {
    const time = new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const isOwn = message.authorId === currentUserId;
    const authorLabel = message.authorName || message.authorId.slice(-6);
    const replyCount = message.replyCount ?? 0;

    if (message.type === 'system') {
        const meta = parseGitHubMeta(message.content);
        if (meta) return <GitHubEventCard meta={meta} />;
        return (
            <div className="text-center text-xs text-text-tertiary py-2">
                {message.content.replace(/<!--github:.+?-->/, '')}
            </div>
        );
    }

    return (
        <div className="group relative flex items-start gap-3 px-5 py-1.5 hover:bg-white/[0.03] transition-colors">
            {/* 아바타 - 36px, 이름 첫 줄과 상단 정렬 */}
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-semibold shrink-0 select-none"
                style={{ backgroundColor: getAvatarColor(message.authorId) }}
            >
                {authorLabel.slice(0, 1).toUpperCase()}
            </div>

            {/* 본문 - 아바타 상단과 이름이 같은 높이 */}
            <div className="min-w-0 flex-1 pt-[1px]">
                <div className="flex items-baseline gap-2 leading-[22px]">
                    <span className="text-[15px] font-bold text-white">{authorLabel}</span>
                    <span className="text-[12px] text-text-tertiary">{time}</span>
                    {message.isEdited && <span className="text-[12px] text-text-tertiary">(수정됨)</span>}
                    {message.isPinned && <span className="text-[12px] text-[#e5c07b] font-medium">고정됨</span>}
                </div>

                {message.content && (
                    <p className="text-[15px] text-white/90 leading-[22px] break-words whitespace-pre-wrap">{message.content}</p>
                )}

                <MessageAttachments attachments={message.attachments} />

                {message.reactions.length > 0 && (
                    <div className="mt-1">
                        <ReactionBar
                            reactions={message.reactions}
                            currentUserId={currentUserId}
                            onToggle={(emoji) => onReact(message.id, emoji)}
                        />
                    </div>
                )}

                {!message.replyToId && replyCount > 0 && onOpenThread && (
                    <button
                        onClick={() => onOpenThread(message)}
                        className="mt-0.5 flex items-center gap-1 text-[13px] text-[#61afef] hover:underline"
                    >
                        {replyCount}개의 답글
                    </button>
                )}
            </div>

            {/* 호버 액션 바 */}
            <div className="absolute right-4 -top-2.5 hidden group-hover:flex items-center rounded-md border border-border-primary bg-bg-secondary shadow-md">
                {onOpenThread && !message.replyToId && (
                    <button onClick={() => onOpenThread(message)} className="px-2 py-1 text-text-tertiary hover:bg-white/5 hover:text-white transition-colors" title="스레드">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </button>
                )}
                {onTogglePin && (
                    <button onClick={() => onTogglePin(message)} className="px-2 py-1 text-text-tertiary hover:bg-white/5 hover:text-[#e5c07b] transition-colors" title={message.isPinned ? '핀 해제' : '핀 고정'}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    </button>
                )}
                <button onClick={() => onReact(message.id, '👍')} className="px-2 py-1 text-text-tertiary hover:bg-white/5 hover:text-white transition-colors" title="리액션">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                {isOwn && onDelete && (
                    <button onClick={() => onDelete(message.id)} className="px-2 py-1 text-text-tertiary hover:bg-red-500/10 hover:text-red-400 transition-colors" title="삭제">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
}
