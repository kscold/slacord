'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Channel } from '@/src/entities/channel/types';

interface Props {
    teamId: string;
    teamName: string;
    channels: Channel[];
}

export function TeamSidebar({ teamId, teamName, channels }: Props) {
    const pathname = usePathname();

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    const navItem = (href: string, label: string, icon: React.ReactNode) => (
        <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(href)
                    ? 'bg-slack-green/20 text-slack-green font-medium'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-white'
            }`}
        >
            {icon}
            {label}
        </Link>
    );

    return (
        <aside className="w-60 bg-bg-secondary border-r border-border-primary flex flex-col h-screen sticky top-0">
            {/* 팀 이름 */}
            <div className="px-4 py-4 border-b border-border-primary">
                <Link href={`/${teamId}`} className="font-bold text-white text-lg truncate block">
                    {teamName}
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* 채널 */}
                <div>
                    <p className="px-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">채널</p>
                    {channels.map((ch) =>
                        navItem(
                            `/${teamId}/channel/${ch.id}`,
                            `# ${ch.name}`,
                            null,
                        ),
                    )}
                </div>

                {/* 도구 */}
                <div>
                    <p className="px-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">도구</p>
                    {navItem(`/${teamId}/issues`, '이슈 트래커',
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>,
                    )}
                    {navItem(`/${teamId}/docs`, '문서/위키',
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>,
                    )}
                    {navItem(`/${teamId}/announcements`, '공지사항',
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>,
                    )}
                </div>

                {/* 설정 */}
                <div>
                    <p className="px-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">설정</p>
                    {navItem(`/${teamId}/settings`, '팀 설정',
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>,
                    )}
                </div>
            </nav>
        </aside>
    );
}
