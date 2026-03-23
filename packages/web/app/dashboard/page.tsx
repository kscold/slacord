'use client';

import { useState, useEffect } from 'react';
import { authApi, teamApi } from '@/lib/api-client';
import type { TeamSummary } from '@/src/entities/team/types';
import type { User } from '@/src/entities/user/types';
import { DashboardShell } from '@/src/widgets/dashboard/ui/DashboardShell';
import { EmptyWorkspaceState } from '@/src/widgets/dashboard/ui/EmptyWorkspaceState';
import { WorkspaceCard } from '@/src/widgets/dashboard/ui/WorkspaceCard';

export default function DashboardPage() {
    const [teams, setTeams] = useState<TeamSummary[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([authApi.getMe().catch(() => null), teamApi.getMyTeams().catch(() => null)]).then(([meRes, teamRes]) => {
            if (meRes?.success && meRes.data) setCurrentUser(meRes.data as User);
            if (teamRes?.success && Array.isArray(teamRes.data)) setTeams(teamRes.data as TeamSummary[]);
            setLoading(false);
        });
    }, []);

    return (
        <DashboardShell title="워크스페이스" description="실시간 대화와 실행 기록이 분리되지 않도록 팀 단위 허브를 관리합니다." currentUserName={currentUser?.username}>
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d6b08a] border-t-transparent" />
                </div>
            ) : teams.length === 0 ? (
                <EmptyWorkspaceState />
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {teams.map((team) => <WorkspaceCard key={team.id} team={team} />)}
                </div>
            )}
        </DashboardShell>
    );
}
