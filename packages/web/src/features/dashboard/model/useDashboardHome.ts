'use client';

import { useEffect, useState } from 'react';
import { authApi, teamApi } from '@/lib/api-client';
import type { TeamSummary } from '@/src/entities/team/types';
import type { User } from '@/src/entities/user/types';

export function useDashboardHome() {
    const [teams, setTeams] = useState<TeamSummary[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        Promise.all([authApi.getMe().catch(() => null), teamApi.getMyTeams().catch(() => null)]).then(([meRes, teamRes]) => {
            if (!active) return;
            if (meRes?.success && meRes.data) setCurrentUser(meRes.data as User);
            if (teamRes?.success && Array.isArray(teamRes.data)) {
                const nextTeams = (teamRes.data as TeamSummary[]).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
                setTeams(nextTeams);
            }
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    return { currentUser, loading, primaryTeam: teams[0], teams };
}
