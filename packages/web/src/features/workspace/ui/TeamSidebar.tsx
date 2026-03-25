'use client';

import { usePathname } from 'next/navigation';
import { resolveChannelLabel } from '@/src/entities/channel/lib/resolveChannelLabel';
import type { Channel } from '@/src/entities/channel/types';
import { useDesktopMac } from '../model/useDesktopMac';
import { useWorkspaceSidebarState } from '../model/useWorkspaceSidebarState';
import { DirectRoomLauncher } from './DirectRoomLauncher';
import { SidebarNavLink } from './SidebarNavLink';
import { SidebarSection } from './SidebarSection';
import { SidebarUserBar } from './SidebarUserBar';
import { SidebarWorkspaceHeader } from './SidebarWorkspaceHeader';
import { CreateChannelButton } from './CreateChannelButton';
import { WorkspaceMobileNav } from './WorkspaceMobileNav';

interface Props {
    teamId: string;
    teamName: string;
    channels: Channel[];
}

export function TeamSidebar({ teamId, teamName, channels }: Props) {
    const pathname = usePathname();
    const isDesktopMac = useDesktopMac();
    const { currentUserId, currentUsername, logout, members } = useWorkspaceSidebarState(teamId);
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    const workspaceChannels = channels.filter((channel) => channel.type === 'public' || channel.type === 'private');
    const directChannels = channels.filter((channel) => channel.type === 'dm' || channel.type === 'group');

    return (
        <>
            <WorkspaceMobileNav active={isActive} channels={channels} currentUserId={currentUserId} members={members} onLogout={logout} teamId={teamId} teamName={teamName} username={currentUsername} />
            <aside className="hidden h-screen w-60 shrink-0 border-r border-border-primary bg-bg-secondary lg:flex lg:flex-col lg:sticky lg:top-0">
                <SidebarWorkspaceHeader teamId={teamId} teamName={teamName} isDesktopMac={isDesktopMac} />
                <nav className="flex-1 space-y-4 overflow-y-auto p-3">
                    <SidebarSection title="채널" action={<CreateChannelButton teamId={teamId} />}>
                        {workspaceChannels.length === 0 && <p className="px-3 py-2 text-xs text-text-tertiary">아직 채널이 없습니다.</p>}
                        {workspaceChannels.map((channel) => <SidebarNavLink key={channel.id} href={`/${teamId}/channel/${channel.id}`} label={`# ${channel.name}`} active={isActive(`/${teamId}/channel/${channel.id}`)} />)}
                    </SidebarSection>
                    <SidebarSection title="DM / 소그룹">
                        <div className="px-3"><DirectRoomLauncher teamId={teamId} members={members.filter((member) => member.userId !== currentUserId)} /></div>
                        <div className="mt-2 space-y-1">
                            {directChannels.length === 0 && <p className="px-3 py-2 text-xs text-text-tertiary">직접 대화가 없습니다.</p>}
                            {directChannels.map((channel) => <SidebarNavLink key={channel.id} href={`/${teamId}/channel/${channel.id}`} label={resolveChannelLabel(channel, members, currentUserId)} active={isActive(`/${teamId}/channel/${channel.id}`)} />)}
                        </div>
                    </SidebarSection>
                    <SidebarSection title="도구">
                        <SidebarNavLink href={`/${teamId}/issues`} label="이슈 트래커" active={isActive(`/${teamId}/issues`)} icon={<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
                        <SidebarNavLink href={`/${teamId}/docs`} label="문서/위키" active={isActive(`/${teamId}/docs`)} icon={<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                        <SidebarNavLink href={`/${teamId}/announcements`} label="공지사항" active={isActive(`/${teamId}/announcements`)} icon={<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>} />
                    </SidebarSection>
                    <SidebarSection title="설정">
                        <SidebarNavLink href={`/${teamId}/docs/archived`} label="휴지통" active={isActive(`/${teamId}/docs/archived`)} icon={<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>} />
                        <SidebarNavLink href={`/${teamId}/settings`} label="워크스페이스 설정" active={isActive(`/${teamId}/settings`)} icon={<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                    </SidebarSection>
                </nav>
                <SidebarUserBar username={currentUsername} onLogout={logout} />
            </aside>
        </>
    );
}
