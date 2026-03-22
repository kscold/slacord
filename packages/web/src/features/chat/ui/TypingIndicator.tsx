interface Props {
    users: string[];
}

export function TypingIndicator({ users }: Props) {
    if (users.length === 0) return null;

    const label =
        users.length === 1
            ? `${users[0]}이(가) 입력 중...`
            : `${users.length}명이 입력 중...`;

    return (
        <div className="px-4 py-1 flex items-center gap-2 text-xs text-text-tertiary">
            <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{label}</span>
        </div>
    );
}
