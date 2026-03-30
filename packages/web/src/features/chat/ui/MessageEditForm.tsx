'use client';

import type { RefObject } from 'react';

interface Props {
    editRef: RefObject<HTMLTextAreaElement | null>;
    value: string;
    onChange: (value: string) => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function MessageEditForm({ editRef, value, onChange, onKeyDown }: Props) {
    return (
        <div className="mt-1">
            <textarea
                ref={editRef}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={onKeyDown}
                className="w-full resize-none rounded-lg border border-[rgba(201,162,114,0.3)] bg-[#1e1814] px-3 py-2 text-[15px] leading-[22px] text-white outline-none focus:border-[#d6b08a]"
                rows={Math.min(value.split('\n').length + 1, 6)}
            />
            <p className="mt-1 text-[11px] text-text-tertiary">Enter로 저장 · Esc로 취소 · Shift+Enter로 줄바꿈</p>
        </div>
    );
}
