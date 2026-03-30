'use client';

import { useState } from 'react';
import type { Message } from '@/src/entities/message/types';
import { EmojiPickerPopover } from './EmojiPickerPopover';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '🙏', '😢'];

interface Props {
    isOwn: boolean;
    message: Message;
    onDelete?: (messageId: string) => void;
    onEdit?: () => void;
    onOpenThread?: () => void;
    onReact: (emoji: string) => void;
    onTogglePin?: () => void;
    visible: boolean;
}

export function MessageActionBar({ isOwn, message, onDelete, onEdit, onOpenThread, onReact, onTogglePin, visible }: Props) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    if (!visible) return null;

    return (
        <div className="absolute right-5 -top-3.5 z-20 flex items-center gap-px rounded-lg border border-border-primary bg-[#1e1814] shadow-lg">
            {onOpenThread && !message.replyToId ? (
                <IconButton onClick={onOpenThread} title="스레드">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </IconButton>
            ) : null}
            {onTogglePin ? (
                <IconButton onClick={onTogglePin} title={message.isPinned ? '핀 해제' : '핀 고정'} accent={message.isPinned ? 'pin' : undefined}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </IconButton>
            ) : null}
            {isOwn && onEdit ? (
                <IconButton onClick={onEdit} title="편집">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </IconButton>
            ) : null}
            <div className="relative">
                <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)} title="리액션">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </IconButton>
                <EmojiPickerPopover
                    align="right"
                    emojis={QUICK_EMOJIS}
                    onClose={() => setShowEmojiPicker(false)}
                    onSelect={onReact}
                    open={showEmojiPicker}
                />
            </div>
            {onDelete ? (
                <IconButton onClick={() => onDelete(message.id)} title="삭제" accent="danger">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </IconButton>
            ) : null}
        </div>
    );
}

function IconButton({
    children,
    onClick,
    title,
    accent,
}: {
    children: React.ReactNode;
    onClick: () => void;
    title: string;
    accent?: 'danger' | 'pin';
}) {
    const accentClass = accent === 'danger'
        ? 'hover:bg-red-500/10 hover:text-red-400'
        : accent === 'pin'
          ? 'hover:bg-white/5 hover:text-[#e5c07b]'
          : 'hover:bg-white/5 hover:text-white';
    return (
        <button onClick={onClick} className={`px-2 py-1.5 text-text-tertiary transition-colors ${accentClass}`} title={title}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{children}</svg>
        </button>
    );
}
