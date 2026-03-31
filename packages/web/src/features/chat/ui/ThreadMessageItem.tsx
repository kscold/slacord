'use client';

import { getAvatarColor } from '@/src/shared/lib/avatar';
import type { Message } from '@/src/entities/message/types';
import { MessageActionToggle } from './MessageActionToggle';

interface Props {
    canDelete: boolean;
    message: Message;
    onDelete?: (id: string) => void;
    showDeleteButton: boolean;
    onToggleDelete: () => void;
}

export function ThreadMessageItem({ canDelete, message, onDelete, showDeleteButton, onToggleDelete }: Props) {
    const authorLabel = message.authorName || message.authorId.slice(-6);
    const time = new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="group relative flex gap-2.5 px-4 py-2 hover:bg-white/[0.03]">
            <div
                className="h-8 w-8 shrink-0 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: getAvatarColor(message.authorId) }}
            >
                {authorLabel.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-bold text-white">{authorLabel}</span>
                    <span className="text-[11px] text-text-tertiary">{time}</span>
                </div>
                {message.content ? <p className="mt-0.5 break-words whitespace-pre-wrap text-[14px] leading-relaxed text-white/90">{message.content}</p> : null}
            </div>
            {canDelete && onDelete ? (
                <div className="absolute right-2 top-1 flex items-center gap-1">
                    <div className={`transition-opacity ${showDeleteButton ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
                        <button
                            onClick={() => onDelete(message.id)}
                            className="flex items-center rounded-md border border-border-primary bg-bg-secondary px-1.5 py-1 text-text-tertiary shadow-md transition-colors hover:bg-red-500/10 hover:text-red-400"
                            title="삭제"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                    <div className="sm:hidden">
                        <MessageActionToggle onClick={onToggleDelete} />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
