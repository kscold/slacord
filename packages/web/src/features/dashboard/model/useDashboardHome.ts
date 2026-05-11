'use client';

import { useEffect, useState } from 'react';
import { authApi, teamApi, unwrapApiArray, unwrapApiData } from '@/lib/api-client';
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
            const user = meRes && unwrapApiData<User>(meRes);
            if (user) setCurrentUser(user);
            if (teamRes?.success) {
                setTeams(unwrapApiArray<TeamSummary>(teamRes).sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
            }
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    return { currentUser, loading, primaryTeam: teams[0], teams };
}
