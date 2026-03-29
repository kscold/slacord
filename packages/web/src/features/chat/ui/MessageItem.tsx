'use client';

import { useState, useRef, useEffect } from 'react';
import { ReactionBar } from './ReactionBar';
import { GitHubEventCard } from './GitHubEventCard';
import { MessageAttachments } from './MessageAttachments';
import { getAvatarColor } from '@/src/shared/lib/avatar';
import type { Message, GitHubEventMeta } from '@/src/entities/message/types';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '🙏', '😢'];

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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const editRef = useRef<HTMLTextAreaElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showEmojiPicker) return;
        const handleClick = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showEmojiPicker]);

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
        <div className={`group relative flex items-start gap-3 px-5 py-1.5 transition-colors ${editing ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}>
            {/* 아바타 */}
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-semibold shrink-0 select-none"
                style={{ backgroundColor: getAvatarColor(message.authorId) }}
            >
                {authorLabel.slice(0, 1).toUpperCase()}
            </div>

            {/* 본문 */}
            <div className="min-w-0 flex-1 pt-[1px]">
                <div className="flex items-baseline gap-2 leading-[22px]">
                    <span className="text-[15px] font-bold text-white">{authorLabel}</span>
                    <span className="text-[12px] text-text-tertiary">{time}</span>
                    {message.isEdited && <span className="text-[12px] text-text-tertiary">(수정됨)</span>}
                    {message.isPinned && <span className="text-[12px] text-[#e5c07b] font-medium">고정됨</span>}
                </div>

                {editing ? (
                    <div className="mt-1">
                        <textarea
                            ref={editRef}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            className="w-full rounded-lg border border-[rgba(201,162,114,0.3)] bg-[#1e1814] px-3 py-2 text-[15px] text-white outline-none resize-none leading-[22px] focus:border-[#d6b08a]"
                            rows={Math.min(editContent.split('\n').length + 1, 6)}
                        />
                        <p className="mt-1 text-[11px] text-text-tertiary">
                            Enter로 저장 · Esc로 취소 · Shift+Enter로 줄바꿈
                        </p>
                    </div>
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

            {/* 호버 액션 바 */}
            {!editing && (
                <div className="absolute right-5 -top-3.5 hidden group-hover:flex items-center gap-px rounded-lg border border-border-primary bg-[#1e1814] shadow-lg z-20">
                    {onOpenThread && !message.replyToId && (
                        <button onClick={() => onOpenThread(message)} className="px-2 py-1.5 text-text-tertiary hover:bg-white/5 hover:text-white transition-colors" title="스레드">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </button>
                    )}
                    {onTogglePin && (
                        <button onClick={() => onTogglePin(message)} className="px-2 py-1.5 text-text-tertiary hover:bg-white/5 hover:text-[#e5c07b] transition-colors" title={message.isPinned ? '핀 해제' : '핀 고정'}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </button>
                    )}
                    {isOwn && onEdit && (
                        <button onClick={startEdit} className="px-2 py-1.5 text-text-tertiary hover:bg-white/5 hover:text-white transition-colors" title="편집">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                    )}
                    <div className="relative" ref={pickerRef}>
                        <button onClick={() => setShowEmojiPicker((prev) => !prev)} className="px-2 py-1.5 text-text-tertiary hover:bg-white/5 hover:text-white transition-colors" title="리액션">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                        {showEmojiPicker && (
                            <div className="absolute right-0 top-full mt-1 flex gap-0.5 rounded-lg border border-border-primary bg-[#1e1814] p-1.5 shadow-lg z-30">
                                {QUICK_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => { onReact(message.id, emoji); setShowEmojiPicker(false); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-md text-lg hover:bg-white/10 transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {onDelete && (
                        <button onClick={() => onDelete(message.id)} className="px-2 py-1.5 text-text-tertiary hover:bg-red-500/10 hover:text-red-400 transition-colors" title="삭제">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
