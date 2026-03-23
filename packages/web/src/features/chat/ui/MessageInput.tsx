'use client';

import { useState, useRef, useCallback } from 'react';

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
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <div className="px-4 py-3 border-t border-border-primary">
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />
            <div className="flex items-end gap-3 bg-bg-secondary rounded-xl border border-border-primary px-4 py-2 focus-within:border-slack-green/50 transition-colors">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 rounded-lg border border-border-primary p-2 text-text-secondary transition-colors hover:border-slack-green/40 hover:text-white"
                >
                    +
                </button>
                <textarea
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`#${channelName}에 메시지 보내기`}
                    rows={1}
                    className="flex-1 bg-transparent text-white text-sm resize-none outline-none placeholder:text-text-tertiary max-h-40 leading-relaxed"
                    style={{ minHeight: '24px' }}
                />
                <button
                    onClick={submit}
                    disabled={!content.trim() || isUploading}
                    className="shrink-0 p-1.5 rounded-lg bg-slack-green text-white disabled:opacity-30 hover:bg-slack-green/90 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
            <p className="text-xs text-text-tertiary mt-1 px-1">
                {isUploading ? '파일 업로드 중...' : 'Enter로 전송 · Shift+Enter로 줄바꿈 · 파일 첨부 가능'}
            </p>
        </div>
    );
}
