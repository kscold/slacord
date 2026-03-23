import { TeamSidebar } from '@/src/features/workspace/ui/TeamSidebar';
import { fetchWorkspaceLayoutData } from '@/lib/server-workspace-data';
import type { Channel } from '@/src/entities/channel/types';

interface Props {
    children: React.ReactNode;
    params: Promise<{ teamId: string }>;
}

export default async function WorkspaceLayout({ children, params }: Props) {
    const { teamId } = await params;

    let teamName = '팀';
    let channels: Channel[] = [];

    try {
        const data = await fetchWorkspaceLayoutData(teamId);
        teamName = data.teamName;
        channels = data.channels;
    } catch {
        // 서버 컴포넌트에서 인증 실패 시 빈 상태로 렌더링
    }

    return (
        <div className="flex h-screen bg-bg-primary overflow-hidden">
            <TeamSidebar teamId={teamId} teamName={teamName} channels={channels} />
            <main className="flex-1 overflow-auto">{children}</main>
        </div>
    );
}
