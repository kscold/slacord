'use client';

import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api-client';
import { useTeamWorkspaceData } from '@/src/features/team/model/useTeamWorkspaceData';

export function useWorkspaceSidebarState(teamId: string) {
    const router = useRouter();
    const workspace = useTeamWorkspaceData(teamId);

    const logout = async () => {
        await authApi.logout();
        router.push('/auth/login');
    };

    return {
        currentMember: workspace.currentMember,
        currentUserId: workspace.currentUserId,
        currentUsername: workspace.currentUsername,
        canWrite: workspace.canWrite,
        logout,
        members: workspace.members,
    };
}
