'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
    channelName: string;
    onSend: (content: string) => void;
    onUpload: (files: File[], content: string) => Promise<void>;
    onTyping: () => void;
    isUploading: boolean;
}

export function MessageInput({ channelName, onSend, onUpload, onTyping, isUploading }: Props) {
    const [content, setContent] = useState('');
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

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        onTyping();
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {}, 2000);
    }, [onTyping]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const submit = () => {
        const trimmed = content.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setContent('');
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
            <div className="flex items-end gap-2 rounded-lg border border-border-primary bg-bg-secondary transition-colors focus-within:border-text-tertiary">
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
                        className="shrink-0 self-end mb-2 mr-2 flex h-7 w-7 items-center justify-center rounded-md bg-slack-green text-white transition-all disabled:opacity-20 hover:bg-slack-green/80"
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
