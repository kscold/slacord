import 'server-only';

import { cookies } from 'next/headers';
import type { Channel } from '@/src/entities/channel/types';

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';

async function serverFetch(path: string) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const response = await fetch(`${API_URL}${path}`, {
        cache: 'no-store',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

    if (!response.ok) {
        throw new Error(`Server fetch failed: ${path}`);
    }

    return response.json();
}

export async function fetchWorkspaceLayoutData(teamId: string) {
    const [teamsRes, channelsRes] = await Promise.all([
        serverFetch('/api/team'),
        serverFetch(`/api/team/${teamId}/channel`),
    ]);

    const teamName =
        teamsRes?.success && Array.isArray(teamsRes.data)
            ? teamsRes.data.find((team: { id: string; name: string }) => team.id === teamId)?.name || '팀'
            : '팀';

    const channels =
        channelsRes?.success && Array.isArray(channelsRes.data)
            ? (channelsRes.data as Channel[])
            : [];

    return { teamName, channels };
}
