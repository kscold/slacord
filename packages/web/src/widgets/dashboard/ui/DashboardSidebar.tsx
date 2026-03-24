'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/dashboard', label: '대시보드', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/dashboard/teams/new', label: '새 팀 만들기', icon: 'M12 4v16m8-8H4' },
    { href: '/dashboard/messages', label: '메시지 검색', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { href: '/dashboard/stats', label: '통계', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

export function DashboardSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-bg-secondary border-r border-border-primary flex flex-col">
            <div className="p-6 border-b border-border-primary">
                <Link href="/" className="flex items-center gap-3">
                    <Image src="/logo.svg" alt="Slacord" width={40} height={40} className="rounded-xl" />
                    <div>
                        <h1 className="text-xl font-bold text-white">Slacord</h1>
                        <p className="text-xs text-text-tertiary mt-0.5">Team Collaboration</p>
                    </div>
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-bg-hover text-white' : 'hover:bg-bg-hover text-text-secondary hover:text-white'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-border-primary text-xs text-text-tertiary">
                <p className="font-semibold text-[#d6b08a]">v1.0.0</p>
                <p className="mt-1">Internal Collaboration Cloud</p>
            </div>
        </aside>
    );
}
