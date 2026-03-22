import { TeamSidebar } from '@/src/features/workspace/ui/TeamSidebar';
import { channelApi, teamApi } from '@/lib/api-client';
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
        const [teamsRes, channelsRes] = await Promise.all([
            teamApi.getMyTeams(),
            channelApi.getChannels(teamId),
        ]);

        if (teamsRes.success && Array.isArray(teamsRes.data)) {
            const team = teamsRes.data.find((t: any) => t.id === teamId);
            if (team) teamName = team.name;
        }
        if (channelsRes.success && Array.isArray(channelsRes.data)) {
            channels = channelsRes.data;
        }
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
