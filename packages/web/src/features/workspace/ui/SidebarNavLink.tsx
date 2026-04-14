'use client';

import Link from 'next/link';

interface Props {
    href: string;
    label: string;
    active: boolean;
    icon?: React.ReactNode;
    unreadCount?: number;
    mentionCount?: number;
}

export function SidebarNavLink({ href, label, active, icon, unreadCount = 0, mentionCount = 0 }: Props) {
    const showMentionBadge = mentionCount > 0;
    const showUnreadBadge = !showMentionBadge && unreadCount > 0;

    return (
        <Link
            href={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                    ? 'bg-slack-green/20 font-medium text-slack-green'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-white'
            }`}
        >
            {icon}
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {showMentionBadge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                    @{mentionCount > 9 ? '9+' : mentionCount}
                </span>
            ) : null}
            {showUnreadBadge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b97532] px-1.5 text-[11px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            ) : null}
        </Link>
    );
}
