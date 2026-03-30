'use client';

import { useState, useRef, useEffect } from 'react';
import { ReactionBar } from './ReactionBar';
import { GitHubEventCard } from './GitHubEventCard';
import { MessageActionBar } from './MessageActionBar';
import { MessageAttachments } from './MessageAttachments';
import { MessageEditForm } from './MessageEditForm';
import { getAvatarColor } from '@/src/shared/lib/avatar';
import type { Message, GitHubEventMeta } from '@/src/entities/message/types';

interface Props {
    message: Message;
    currentUserId: string;
    onReact: (messageId: string, emoji: string) => void;
    onDelete?: (messageId: string) => void;
    onEdit?: (messageId: string, content: string) => Promise<void>;
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

export function MessageItem({ message, currentUserId, onReact, onDelete, onEdit, onOpenThread, onTogglePin }: Props) {
    const time = new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const isOwn = message.authorId === currentUserId;
    const authorLabel = message.authorName || message.authorId.slice(-6);
    const replyCount = message.replyCount ?? 0;
    const [showActions, setShowActions] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const editRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (editing && editRef.current) {
            editRef.current.focus();
            editRef.current.selectionStart = editRef.current.value.length;
        }
    }, [editing]);

    const startEdit = () => {
        setEditContent(message.content);
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setEditContent('');
    };

    const saveEdit = async () => {
        const trimmed = editContent.trim();
        if (!trimmed || trimmed === message.content || !onEdit) return;
        await onEdit(message.id, trimmed);
        setEditing(false);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') { cancelEdit(); return; }
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void saveEdit();
        }
    };

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
        <div
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className={`relative flex items-start gap-3 px-5 py-1.5 transition-colors ${editing ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}
        >
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-semibold shrink-0 select-none"
                style={{ backgroundColor: getAvatarColor(message.authorId) }}
            >
                {authorLabel.slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1 pt-[1px]">
                <div className="flex items-baseline gap-2 leading-[22px]">
                    <span className="text-[15px] font-bold text-white">{authorLabel}</span>
                    <span className="text-[12px] text-text-tertiary">{time}</span>
                    {message.isEdited && <span className="text-[12px] text-text-tertiary">(수정됨)</span>}
                    {message.isPinned && <span className="text-[12px] text-[#e5c07b] font-medium">고정됨</span>}
                </div>

                {editing ? (
                    <MessageEditForm editRef={editRef} onChange={setEditContent} onKeyDown={handleEditKeyDown} value={editContent} />
                ) : (
                    message.content && (
                        <p className="text-[15px] text-white/90 leading-[22px] break-words whitespace-pre-wrap">{message.content}</p>
                    )
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

            {!editing ? (
                <MessageActionBar
                    isOwn={isOwn}
                    message={message}
                    onDelete={onDelete}
                    onEdit={onEdit ? startEdit : undefined}
                    onOpenThread={onOpenThread && !message.replyToId ? () => onOpenThread(message) : undefined}
                    onReact={(emoji) => onReact(message.id, emoji)}
                    onTogglePin={onTogglePin ? () => void onTogglePin(message) : undefined}
                    visible={showActions}
                />
            ) : null}
        </div>
    );
}
