'use client';

import { useEffect, useState } from 'react';
import { authApi, channelApi, messageApi, teamApi, unwrapApiArray, unwrapApiData } from '@/lib/api-client';
import type { Message } from '@/src/entities/message/types';
import type { TeamSummary } from '@/src/entities/team/types';

interface WorkspaceStat {
    id: string;
    name: string;
    channels: number;
    members: number;
    messages: number;
    todayMessages: number;
    githubLinked: boolean;
}

export function useDashboardStats() {
    const [currentUserName, setCurrentUserName] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<WorkspaceStat[]>([]);

    useEffect(() => {
        let active = true;
        Promise.all([authApi.getMe().catch(() => null), teamApi.getMyTeams().catch(() => null)])
            .then(async ([meRes, teamRes]) => {
                if (!active) return;
                const meData = meRes && unwrapApiData<{ username?: string }>(meRes);
                if (meData) setCurrentUserName(meData.username);
                const teams = teamRes ? unwrapApiArray<TeamSummary>(teamRes) : [];
                setStats(await buildStats(teams));
            })
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    const totals = stats.reduce(
        (acc, item) => ({
            workspaces: acc.workspaces + 1,
            channels: acc.channels + item.channels,
            members: acc.members + item.members,
            messages: acc.messages + item.messages,
            todayMessages: acc.todayMessages + item.todayMessages,
            githubLinked: acc.githubLinked + (item.githubLinked ? 1 : 0),
        }),
        { workspaces: 0, channels: 0, members: 0, messages: 0, todayMessages: 0, githubLinked: 0 },
    );

    return { currentUserName, loading, stats, totals };
}

async function buildStats(teams: TeamSummary[]) {
    const today = new Date().toDateString();
    return Promise.all(
        teams.map(async (team) => {
            const channels = unwrapApiArray<{ id: string; type: string }>(await channelApi.getChannels(team.id)).filter((item) => item.type !== 'dm');
            const messages = await Promise.all(channels.map((channel) => messageApi.getMessages(channel.id, undefined, 50).then((res) => unwrapApiArray<Message>(res))));
            const flat = messages.flat();
            return {
                id: team.id,
                name: team.name,
                channels: channels.length,
                members: team.memberCount,
                messages: flat.length,
                todayMessages: flat.filter((message) => new Date(message.createdAt).toDateString() === today).length,
                githubLinked: Boolean(team.githubConfig?.repoUrl),
            };
        }),
    );
}
