'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { resolveChannelLabel } from '@/src/entities/channel/lib/resolveChannelLabel';
import type { Channel } from '@/src/entities/channel/types';
import { WorkspaceSearchPalette } from '@/src/features/search/ui/WorkspaceSearchPalette';
import { useDesktopMac } from '../model/useDesktopMac';
import { useWorkspaceSidebarState } from '../model/useWorkspaceSidebarState';
import { useWorkspaceChannels } from '../model/useWorkspaceChannels';
import { DirectRoomLauncher } from './DirectRoomLauncher';
import { SidebarNavLink } from './SidebarNavLink';
import { SidebarSection } from './SidebarSection';
import { SidebarUserBar } from './SidebarUserBar';
import { SidebarWorkspaceHeader } from './SidebarWorkspaceHeader';
import { CreateChannelButton } from './CreateChannelButton';
import { WorkspaceMobileNav } from './WorkspaceMobileNav';
import { NotificationBell } from '@/src/features/notification/ui/NotificationBell';
import { channelApi } from '@/lib/api-client';

interface Props {
    teamId: string;
    teamName: string;
    channels: Channel[];
}

export function TeamSidebar({ teamId, teamName, channels }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const isDesktopMac = useDesktopMac();
    const [searchOpen, setSearchOpen] = useState(false);
    const searchButtonRef = useRef<HTMLButtonElement>(null);
    const { canWrite, currentUserId, currentUsername, logout, members } = useWorkspaceSidebarState(teamId);
    const activeChannelId = pathname.startsWith(`/${teamId}/channel/`) ? (pathname.split('/')[3] ?? null) : null;
    const { channels: sidebarChannels } = useWorkspaceChannels({
        teamId,
        initialChannels: channels,
        currentUserId,
        activeChannelId,
    });
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    const workspaceChannels = sidebarChannels.filter(
        (channel) => channel.type === 'public' || channel.type === 'private',
    );
    const directChannels = sidebarChannels.filter((channel) => channel.type === 'dm' || channel.type === 'group');

    // 채널 생성 인라인 폼 상태
    const [channelFormOpen, setChannelFormOpen] = useState(false);
    const [channelName, setChannelName] = useState('');
    const [channelType, setChannelType] = useState<'public' | 'private' | 'voice'>('public');
    const [channelLoading, setChannelLoading] = useState(false);
    const channelInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (channelFormOpen) {
            setTimeout(() => channelInputRef.current?.focus(), 50);
        } else {
            setChannelName('');
            setChannelType('public');
        }
    }, [channelFormOpen]);

    const handleCreateChannel = async () => {
        const trimmed = channelName.trim();
        if (!trimmed || channelLoading) return;
        setChannelLoading(true);
        try {
            const res = await channelApi.createChannel(teamId, { name: trimmed, type: channelType });
            if (res.success && res.data?.id) {
                setChannelFormOpen(false);
                router.push(`/${teamId}/channel/${res.data.id}`);
                router.refresh();
            }
        } finally {
            setChannelLoading(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
            event.preventDefault();
            setSearchOpen(true);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <WorkspaceMobileNav
                active={isActive}
                canWrite={canWrite}
                channels={sidebarChannels}
                currentUserId={currentUserId}
                members={members}
                onLogout={logout}
                onOpenSearch={() => setSearchOpen(true)}
                teamId={teamId}
                teamName={teamName}
                username={currentUsername}
            />
            <aside className="hidden h-screen w-60 shrink-0 border-r border-border-primary bg-bg-secondary lg:flex lg:flex-col lg:sticky lg:top-0">
                <SidebarWorkspaceHeader teamId={teamId} teamName={teamName} isDesktopMac={isDesktopMac} />

                <nav className="flex-1 overflow-y-auto py-3">
                    {/* 검색 버튼 */}
                    <div className="px-3 mb-1">
                        <button
                            ref={searchButtonRef}
                            type="button"
                            onClick={() => setSearchOpen(true)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-white"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="flex-1 text-left">검색</span>
                            <span className="rounded border border-border-primary px-1.5 py-0.5 text-[10px] text-text-tertiary">
                                {isDesktopMac ? '⌘K' : 'Ctrl+K'}
                            </span>
                        </button>
                    </div>

                    {/* 알림 벨 */}
                    <div className="px-3 mb-3">
                        <NotificationBell teamId={teamId} />
                    </div>

                    {/* 채널 섹션 */}
                    <SidebarSection
                        title="채널"
                        action={
                            canWrite ? (
                                <CreateChannelButton
                                    open={channelFormOpen}
                                    onToggle={() => setChannelFormOpen((v) => !v)}
                                />
                            ) : undefined
                        }
                    >
                        {/* 인라인 채널 생성 폼 — absolute 없이 문서 흐름 안에 렌더링 */}
                        {channelFormOpen && (
                            <div className="mx-3 mb-2 space-y-2 rounded-xl border border-[rgba(201,162,114,0.25)] bg-[#1e1814] p-3">
                                <input
                                    ref={channelInputRef}
                                    value={channelName}
                                    onChange={(e) => setChannelName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') void handleCreateChannel();
                                        if (e.key === 'Escape') setChannelFormOpen(false);
                                    }}
                                    placeholder="채널 이름"
                                    className="w-full rounded-lg border border-border-primary bg-bg-primary px-3 py-1.5 text-sm text-white outline-none focus:border-slack-green/50"
                                />
                                <div className="flex items-center gap-1.5">
                                    {(['public', 'private', 'voice'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setChannelType(t)}
                                            className={`rounded-full px-2 py-0.5 text-[11px] transition ${channelType === t ? 'bg-slack-green text-white' : 'border border-border-primary text-text-tertiary hover:text-white'}`}
                                        >
                                            {t === 'public' ? '공개' : t === 'private' ? '비공개' : '음성'}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setChannelFormOpen(false)}
                                        className="flex-1 rounded-lg border border-border-primary px-2 py-1 text-xs text-text-secondary hover:text-white"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={() => void handleCreateChannel()}
                                        disabled={channelLoading || !channelName.trim()}
                                        className="flex-1 rounded-lg bg-slack-green px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                                    >
                                        {channelLoading ? '...' : '만들기'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {workspaceChannels.length === 0 && !channelFormOpen && (
                            <p className="px-3 py-2 text-xs text-text-tertiary">아직 채널이 없습니다.</p>
                        )}
                        <div className="space-y-0.5">
                            {workspaceChannels.map((channel) => (
                                <SidebarNavLink
                                    key={channel.id}
                                    href={`/${teamId}/channel/${channel.id}`}
                                    label={`# ${channel.name}`}
                                    active={isActive(`/${teamId}/channel/${channel.id}`)}
                                    unreadCount={channel.unreadCount}
                                    mentionCount={channel.mentionCount}
                                />
                            ))}
                        </div>
                    </SidebarSection>

                    {/* DM / 소그룹 섹션 */}
                    <div className="mt-4">
                        <SidebarSection title="DM / 소그룹">
                            {canWrite ? (
                                <div className="px-3">
                                    <DirectRoomLauncher
                                        teamId={teamId}
                                        members={members.filter((member) => member.userId !== currentUserId)}
                                    />
                                </div>
                            ) : (
                                <p className="px-3 py-2 text-xs text-text-tertiary">
                                    guest는 읽기 전용입니다.
                                </p>
                            )}
                            <div className="mt-1 space-y-0.5">
                                {directChannels.length === 0 && (
                                    <p className="px-3 py-1.5 text-xs text-text-tertiary">직접 대화가 없습니다.</p>
                                )}
                                {directChannels.map((channel) => (
                                    <SidebarNavLink
                                        key={channel.id}
                                        href={`/${teamId}/channel/${channel.id}`}
                                        label={resolveChannelLabel(channel, members, currentUserId)}
                                        active={isActive(`/${teamId}/channel/${channel.id}`)}
                                        unreadCount={channel.unreadCount}
                                        mentionCount={channel.mentionCount}
                                    />
                                ))}
                            </div>
                        </SidebarSection>
                    </div>

                    {/* 도구 섹션 */}
                    <div className="mt-4">
                        <SidebarSection title="도구">
                            <div className="space-y-0.5">
                                <SidebarNavLink
                                    href={`/${teamId}/issues`}
                                    label="이슈 트래커"
                                    active={isActive(`/${teamId}/issues`)}
                                    icon={
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    }
                                />
                                <SidebarNavLink
                                    href={`/${teamId}/docs`}
                                    label="문서/위키"
                                    active={isActive(`/${teamId}/docs`)}
                                    icon={
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    }
                                />
                                <SidebarNavLink
                                    href={`/${teamId}/announcements`}
                                    label="공지사항"
                                    active={isActive(`/${teamId}/announcements`)}
                                    icon={
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                        </svg>
                                    }
                                />
                            </div>
                        </SidebarSection>
                    </div>

                    {/* 설정 섹션 */}
                    <div className="mt-4">
                        <SidebarSection title="설정">
                            <div className="space-y-0.5">
                                <SidebarNavLink
                                    href={`/${teamId}/docs/archived`}
                                    label="휴지통"
                                    active={isActive(`/${teamId}/docs/archived`)}
                                    icon={
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    }
                                />
                                <SidebarNavLink
                                    href={`/${teamId}/settings`}
                                    label="워크스페이스 설정"
                                    active={isActive(`/${teamId}/settings`)}
                                    icon={
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    }
                                />
                            </div>
                        </SidebarSection>
                    </div>
                </nav>

                <SidebarUserBar username={currentUsername} onLogout={logout} />
            </aside>

            <WorkspaceSearchPalette
                onClose={() => setSearchOpen(false)}
                open={searchOpen}
                restoreFocusRef={searchButtonRef}
                workspace={{
                    canWrite,
                    channels: sidebarChannels,
                    currentUserId,
                    members,
                    teamId,
                }}
            />
        </>
    );
}
