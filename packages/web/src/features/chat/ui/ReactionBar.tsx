'use client';

import { useState } from 'react';
import type { Reaction } from '@/src/entities/message/types';
import { EmojiPickerPopover } from './EmojiPickerPopover';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🚀', '👀'];

interface Props {
    reactions: Reaction[];
    currentUserId: string;
    onToggle: (emoji: string) => void;
}

export function ReactionBar({ reactions, currentUserId, onToggle }: Props) {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {reactions.map((r) => {
                const reacted = r.userIds.includes(currentUserId);
                return (
                    <button
                        key={r.emoji}
                        onClick={() => onToggle(r.emoji)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                            reacted
                                ? 'bg-slack-green/20 border-slack-green/40 text-slack-green'
                                : 'bg-bg-tertiary border-border-primary text-text-secondary hover:border-slack-green/40'
                        }`}
                    >
                        <span>{r.emoji}</span>
                        <span>{r.userIds.length}</span>
                    </button>
                );
            })}
            <div className="relative">
                <button
                    onClick={() => setShowPicker((prev) => !prev)}
                    className="flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs text-text-tertiary transition-colors hover:border-border-primary hover:text-text-secondary"
                >
                    +
                </button>
                <EmojiPickerPopover
                    align="left"
                    emojis={QUICK_EMOJIS}
                    onClose={() => setShowPicker(false)}
                    onSelect={onToggle}
                    open={showPicker}
                />
            </div>
        </div>
    );
}
