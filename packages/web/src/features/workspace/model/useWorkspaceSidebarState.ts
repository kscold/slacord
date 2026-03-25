'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, teamApi } from '@/lib/api-client';
import type { TeamMemberSummary } from '@/src/entities/team/types';

export function useWorkspaceSidebarState(teamId: string) {
    const router = useRouter();
    const [currentUserId, setCurrentUserId] = useState('');
    const [currentUsername, setCurrentUsername] = useState('');
    const [members, setMembers] = useState<TeamMemberSummary[]>([]);

    useEffect(() => {
        let active = true;
        Promise.all([authApi.getMe().catch(() => null), teamApi.getMembers(teamId).catch(() => null)]).then(([meRes, memberRes]) => {
            if (!active) return;
            if (meRes?.success && meRes.data) {
                const user = meRes.data as { id: string; username: string };
                setCurrentUserId(user.id);
                setCurrentUsername(user.username);
            }
            if (memberRes?.success && Array.isArray(memberRes.data)) setMembers(memberRes.data as TeamMemberSummary[]);
        });
        return () => {
            active = false;
        };
    }, [teamId]);

    const logout = async () => {
        await authApi.logout();
        router.push('/auth/login');
    };

    return { currentUserId, currentUsername, logout, members };
}
