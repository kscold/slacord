'use client';

import type { Reaction } from '@/src/entities/message/types';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🚀', '👀'];

interface Props {
    reactions: Reaction[];
    currentUserId: string;
    onToggle: (emoji: string) => void;
}

export function ReactionBar({ reactions, currentUserId, onToggle }: Props) {
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
            {/* 이모지 추가 버튼 */}
            <div className="relative group">
                <button className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-transparent text-text-tertiary hover:border-border-primary hover:text-text-secondary transition-colors">
                    +
                </button>
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex bg-bg-secondary border border-border-primary rounded-lg p-1 gap-0.5 z-10">
                    {QUICK_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => onToggle(emoji)}
                            className="p-1 rounded hover:bg-bg-hover text-base"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
