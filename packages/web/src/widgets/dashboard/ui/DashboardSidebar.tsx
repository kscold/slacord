'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/src/shared/config/site';

const items = [
    { href: '/dashboard', label: '워크스페이스' },
    { href: '/dashboard/teams/new', label: '새 워크스페이스' },
    { href: '/dashboard/messages', label: '메시지 검색' },
    { href: '/dashboard/stats', label: '운영 지표' },
];

interface Props {
    currentUserName?: string;
}

export function DashboardSidebar({ currentUserName }: Props) {
    const pathname = usePathname();
    return (
        <aside className="w-72 border-r border-border-primary bg-bg-secondary p-6">
            <Link href="/" className="block">
                <p className="text-xs uppercase tracking-[0.24em] text-[#d6b08a]">{siteConfig.footerLabel}</p>
                <p className="mt-3 text-2xl font-bold text-white">{siteConfig.name}</p>
                <p className="mt-2 text-sm leading-6 text-[#c7b8a8]">{siteConfig.dashboardDescription}</p>
            </Link>
            <nav className="mt-8 space-y-2">
                {items.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} className={`block rounded-2xl px-4 py-3 text-sm transition ${active ? 'bg-[#2a1d12] text-white' : 'text-text-secondary hover:bg-bg-hover hover:text-white'}`}>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="mt-8 rounded-2xl border border-border-primary bg-bg-tertiary p-4">
                <p className="text-xs text-text-tertiary">현재 사용자</p>
                <p className="mt-2 text-sm font-semibold text-white">{currentUserName ?? '워크스페이스 멤버'}</p>
            </div>
        </aside>
    );
}
