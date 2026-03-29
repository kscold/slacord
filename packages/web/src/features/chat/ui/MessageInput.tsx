'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { getAvatarColor } from '@/src/shared/lib/avatar';
import type { TeamMemberSummary } from '@/src/entities/team/types';

interface Props {
    channelName: string;
    members?: TeamMemberSummary[];
    onSend: (content: string) => void;
    onUpload: (files: File[], content: string) => Promise<void>;
    onTyping: () => void;
    isUploading: boolean;
}

export function MessageInput({ channelName, members = [], onSend, onUpload, onTyping, isUploading }: Props) {
    const [content, setContent] = useState('');
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const autoResize = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }, []);

    useEffect(() => { autoResize(); }, [content, autoResize]);

    // @멘션 필터링
    const mentionCandidates = useMemo(() => {
        if (mentionQuery === null || members.length === 0) return [];
        const q = mentionQuery.toLowerCase();
        return members
            .filter((m) => {
                const name = m.user?.username?.toLowerCase() ?? '';
                return name.includes(q);
            })
            .slice(0, 6);
    }, [mentionQuery, members]);

    const detectMention = (value: string, cursorPos: number) => {
        const before = value.slice(0, cursorPos);
        const match = before.match(/@(\S*)$/);
        if (match) {
            setMentionQuery(match[1]);
            setMentionIndex(0);
        } else {
            setMentionQuery(null);
        }
    };

    const insertMention = (username: string) => {
        const el = textareaRef.current;
        if (!el) return;
        const pos = el.selectionStart;
        const before = content.slice(0, pos);
        const after = content.slice(pos);
        const atIdx = before.lastIndexOf('@');
        const newContent = before.slice(0, atIdx) + `@${username} ` + after;
        setContent(newContent);
        setMentionQuery(null);
        setTimeout(() => {
            el.focus();
            const newPos = atIdx + username.length + 2;
            el.selectionStart = newPos;
            el.selectionEnd = newPos;
        }, 0);
    };

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);
        detectMention(val, e.target.selectionStart);
        onTyping();
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {}, 2000);
    }, [onTyping]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // 멘션 드롭업이 열려있을 때
        if (mentionQuery !== null && mentionCandidates.length > 0) {
            if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex((i) => Math.max(0, i - 1)); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((i) => Math.min(mentionCandidates.length - 1, i + 1)); return; }
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                insertMention(mentionCandidates[mentionIndex]?.user?.username ?? '');
                return;
            }
            if (e.key === 'Escape') { setMentionQuery(null); return; }
        }

        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
        }
    };

    const submit = () => {
        const trimmed = content.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setContent('');
        setMentionQuery(null);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0) return;
        await onUpload(files, content.trim());
        setContent('');
        event.target.value = '';
    };

    return (
        <div className="shrink-0 px-5 pb-4 pt-1">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
            <div className="relative flex items-end gap-2 rounded-lg border border-border-primary bg-[#1e1814] transition-colors focus-within:border-[#d6b08a]/60">
                {/* @멘션 드롭업 */}
                {mentionQuery !== null && mentionCandidates.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-[rgba(201,162,114,0.25)] bg-[#1e1814] shadow-xl z-30 overflow-hidden">
                        {mentionCandidates.map((m, i) => {
                            const name = m.user?.username ?? m.userId;
                            return (
                                <button
                                    key={m.userId}
                                    onMouseDown={(e) => { e.preventDefault(); insertMention(name); }}
                                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${i === mentionIndex ? 'bg-white/8 text-white' : 'text-text-secondary hover:bg-white/5'}`}
                                >
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: getAvatarColor(m.userId) }}>
                                        {name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <span className="font-medium">{name}</span>
                                    <span className="ml-auto text-[11px] text-text-tertiary">{m.role}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 self-end mb-2 ml-2 flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-white/10 hover:text-white"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`#${channelName}에 메시지 보내기`}
                    rows={1}
                    className="flex-1 bg-transparent py-2.5 text-[14px] text-white resize-none outline-none placeholder:text-text-tertiary leading-[1.5]"
                    style={{ minHeight: '22px', maxHeight: '160px' }}
                />
                {isUploading ? (
                    <div className="shrink-0 self-end mb-2 mr-2">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slack-green border-t-transparent" />
                    </div>
                ) : (
                    <button
                        onClick={submit}
                        disabled={!content.trim()}
                        className="shrink-0 self-end mb-2 mr-2 flex h-7 w-7 items-center justify-center rounded-md bg-slack-green text-white transition-all disabled:opacity-20 hover:brightness-110"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
