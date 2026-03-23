'use client';

import { ReactionBar } from './ReactionBar';
import { GitHubEventCard } from './GitHubEventCard';
import { MessageAttachments } from './MessageAttachments';
import type { Message, GitHubEventMeta } from '@/src/entities/message/types';

interface Props {
    message: Message;
    currentUserId: string;
    onReact: (messageId: string, emoji: string) => void;
    onDelete?: (messageId: string) => void;
    onOpenThread?: (message: Message) => void;
    onTogglePin?: (message: Message) => Promise<unknown>;
}

/** GitHub 이벤트 메타데이터를 content에서 파싱 */
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
    const authorLabel = isOwn ? '나' : message.authorName || message.authorId.slice(-6);

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
        <div className={`group flex gap-3 px-4 py-1.5 hover:bg-bg-hover/30 transition-colors ${isOwn ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-slack-green/20 flex items-center justify-center text-slack-green text-xs font-bold shrink-0 mt-0.5">
                {message.authorId.slice(0, 2).toUpperCase()}
            </div>
            <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-text-secondary">{authorLabel}</span>
                    <span className="text-xs text-text-tertiary">{time}</span>
                    {message.isEdited && <span className="text-xs text-text-tertiary">(수정됨)</span>}
                    {message.isPinned && <span className="text-xs text-[#d6b08a]">PINNED</span>}
                </div>
                {message.replyToId && <span className="mb-1 text-xs text-text-tertiary">스레드 답글</span>}
                {message.content && (
                    <div className="bg-bg-secondary rounded-xl px-3 py-2 text-sm text-white break-words">
                        {message.content}
                    </div>
                )}
                <MessageAttachments attachments={message.attachments} />
                {message.reactions.length > 0 && (
                    <ReactionBar
                        reactions={message.reactions}
                        currentUserId={currentUserId}
                        onToggle={(emoji) => onReact(message.id, emoji)}
                    />
                )}
            </div>
            {/* 호버 액션 버튼 */}
            {isOwn && onDelete && (
                <div className="hidden group-hover:flex items-center gap-1 self-start pt-1">
                    {onOpenThread && (
                        <button onClick={() => onOpenThread(message)} className="p-1 rounded text-text-tertiary hover:text-slack-green transition-colors text-xs">
                            스레드
                        </button>
                    )}
                    {onTogglePin && (
                        <button onClick={() => onTogglePin(message)} className="p-1 rounded text-text-tertiary hover:text-[#d6b08a] transition-colors text-xs">
                            {message.isPinned ? '핀해제' : '핀'}
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(message.id)}
                        className="p-1 rounded text-text-tertiary hover:text-red-400 hover:bg-red-400/10 transition-colors text-xs"
                    >
                        삭제
                    </button>
                </div>
            )}
            {!isOwn && (onOpenThread || onTogglePin) && (
                <div className="hidden group-hover:flex items-center gap-1 self-start pt-1">
                    {onOpenThread && <button onClick={() => onOpenThread(message)} className="p-1 rounded text-text-tertiary hover:text-slack-green transition-colors text-xs">스레드</button>}
                    {onTogglePin && <button onClick={() => onTogglePin(message)} className="p-1 rounded text-text-tertiary hover:text-[#d6b08a] transition-colors text-xs">{message.isPinned ? '핀해제' : '핀'}</button>}
                </div>
            )}
        </div>
    );
}
