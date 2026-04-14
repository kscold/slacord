'use client';

import Link from 'next/link';
import { useState } from 'react';
import { resolveChannelLabel } from '@/src/entities/channel/lib/resolveChannelLabel';
import type { Channel } from '@/src/entities/channel/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import { DirectRoomLauncher } from './DirectRoomLauncher';
import { SidebarNavLink } from './SidebarNavLink';
import { SidebarSection } from './SidebarSection';

interface Props {
    active: (href: string) => boolean;
    canWrite?: boolean;
    channels: Channel[];
    currentUserId: string;
    members: TeamMemberSummary[];
    onLogout: () => Promise<void>;
    teamId: string;
    teamName: string;
    username: string;
}

export function WorkspaceMobileNav({
    active,
    canWrite = true,
    channels,
    currentUserId,
    members,
    onLogout,
    teamId,
    teamName,
    username,
}: Props) {
    const [open, setOpen] = useState(false);
    const workspaceChannels = channels.filter((channel) => channel.type === 'public' || channel.type === 'private');
    const directChannels = channels.filter((channel) => channel.type === 'dm' || channel.type === 'group');
    const firstChannel = workspaceChannels[0];

    return (
        <div className="border-b border-border-primary bg-bg-secondary/95 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                    <Link href={`/${teamId}`} className="block truncate text-lg font-bold text-white">
                        {teamName}
                    </Link>
                    <p className="text-xs text-text-tertiary">워크스페이스</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard"
                        className="rounded-full border border-border-primary px-3 py-2 text-xs text-text-secondary"
                    >
                        대시보드
                    </Link>
                    <button
                        onClick={() => setOpen((value) => !value)}
                        className="rounded-full bg-[#b97532] px-3 py-2 text-xs font-semibold text-white"
                    >
                        {open ? '닫기' : '메뉴'}
                    </button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto px-4 pb-4">
                <QuickLink href={`/${teamId}`} label="홈" active={active(`/${teamId}`)} />
                {firstChannel ? (
                    <QuickLink
                        href={`/${teamId}/channel/${firstChannel.id}`}
                        label={`# ${firstChannel.name}`}
                        active={active(`/${teamId}/channel/${firstChannel.id}`)}
                    />
                ) : null}
                <QuickLink href={`/${teamId}/issues`} label="이슈" active={active(`/${teamId}/issues`)} />
                <QuickLink href={`/${teamId}/docs`} label="문서" active={active(`/${teamId}/docs`)} />
                <QuickLink href={`/${teamId}/announcements`} label="공지" active={active(`/${teamId}/announcements`)} />
            </div>

            {open ? (
                <div className="border-t border-border-primary px-4 py-4">
                    <div className="space-y-4">
                        <SidebarSection title="채널">
                            {workspaceChannels.map((channel) => (
                                <SidebarNavLink
                                    key={channel.id}
                                    href={`/${teamId}/channel/${channel.id}`}
                                    label={`# ${channel.name}`}
                                    active={active(`/${teamId}/channel/${channel.id}`)}
                                    unreadCount={channel.unreadCount}
                                    mentionCount={channel.mentionCount}
                                />
                            ))}
                        </SidebarSection>
                        <SidebarSection title="DM / 소그룹">
                            {canWrite ? (
                                <div className="px-3">
                                    <DirectRoomLauncher
                                        teamId={teamId}
                                        members={members.filter((member) => member.userId !== currentUserId)}
                                    />
                                </div>
                            ) : (
                                <p className="px-3 py-2 text-xs text-text-tertiary">guest는 읽기 전용이라 DM이나 소그룹을 만들 수 없습니다.</p>
                            )}
                            <div className="mt-2 space-y-1">
                                {directChannels.map((channel) => (
                                    <SidebarNavLink
                                        key={channel.id}
                                        href={`/${teamId}/channel/${channel.id}`}
                                        label={resolveChannelLabel(channel, members, currentUserId)}
                                        active={active(`/${teamId}/channel/${channel.id}`)}
                                        unreadCount={channel.unreadCount}
                                        mentionCount={channel.mentionCount}
                                    />
                                ))}
                            </div>
                        </SidebarSection>
                        <SidebarSection title="바로가기">
                            <SidebarNavLink
                                href={`/${teamId}/settings`}
                                label="워크스페이스 설정"
                                active={active(`/${teamId}/settings`)}
                            />
                            <SidebarNavLink
                                href={`/${teamId}/docs/archived`}
                                label="휴지통"
                                active={active(`/${teamId}/docs/archived`)}
                            />
                        </SidebarSection>
                        <div className="flex items-center justify-between border-t border-border-primary px-3 pt-4">
                            <span className="truncate text-sm font-medium text-white">{username || '...'}</span>
                            <button
                                onClick={() => void onLogout()}
                                className="rounded-lg px-2 py-1 text-xs text-text-tertiary"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function QuickLink({ active, href, label }: { active: boolean; href: string; label: string }) {
    const tone = active ? 'border-[#d6b08a]/45 bg-[#2a1d12] text-white' : 'border-border-primary text-text-secondary';
    return (
        <Link href={href} className={`shrink-0 rounded-full border px-3 py-2 text-xs ${tone}`}>
            {label}
        </Link>
    );
}
