'use client';

import { useState, useRef, useCallback } from 'react';

interface Props {
    channelName: string;
    onSend: (content: string) => void;
    onTyping: () => void;
}

export function MessageInput({ channelName, onSend, onTyping }: Props) {
    const [content, setContent] = useState('');
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

    return (
        <div className="px-4 py-3 border-t border-border-primary">
            <div className="flex items-end gap-3 bg-bg-secondary rounded-xl border border-border-primary px-4 py-2 focus-within:border-slack-green/50 transition-colors">
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
                    disabled={!content.trim()}
                    className="shrink-0 p-1.5 rounded-lg bg-slack-green text-white disabled:opacity-30 hover:bg-slack-green/90 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
            <p className="text-xs text-text-tertiary mt-1 px-1">Enter로 전송 · Shift+Enter로 줄바꿈</p>
        </div>
    );
}
