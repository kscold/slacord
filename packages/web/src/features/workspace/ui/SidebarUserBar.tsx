interface Props {
    username: string;
    onLogout: () => Promise<void>;
}

export function SidebarUserBar({ username, onLogout }: Props) {
    return (
        <div className="border-t border-border-primary px-4 py-3">
            <div className="flex items-center justify-between">
                <span className="truncate text-sm font-medium text-white">{username || '...'}</span>
                <button onClick={onLogout} className="rounded-lg px-2 py-1 text-xs text-text-tertiary transition-colors hover:bg-white/8 hover:text-white">
                    로그아웃
                </button>
            </div>
        </div>
    );
}
