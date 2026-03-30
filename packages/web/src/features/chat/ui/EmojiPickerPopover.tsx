'use client';

import { useEffect, useRef } from 'react';

interface Props {
    emojis: string[];
    open: boolean;
    onClose: () => void;
    onSelect: (emoji: string) => void;
    align?: 'left' | 'right';
}

export function EmojiPickerPopover({ emojis, open, onClose, onSelect, align = 'right' }: Props) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleOutside = (event: MouseEvent) => {
            if (panelRef.current?.contains(event.target as Node)) return;
            onClose();
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [onClose, open]);

    if (!open) return null;

    return (
        <div
            ref={panelRef}
            className={`absolute top-full mt-1 flex gap-0.5 rounded-lg border border-border-primary bg-[#1e1814] p-1.5 shadow-lg z-30 ${align === 'left' ? 'left-0' : 'right-0'}`}
        >
            {emojis.map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => {
                        onSelect(emoji);
                        onClose();
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-white/10"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}
