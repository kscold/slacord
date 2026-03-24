'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { authApi, channelApi, messageApi, teamApi } from '@/lib/api-client';
import type { Message } from '@/src/entities/message/types';
import type { TeamSummary } from '@/src/entities/team/types';

interface SearchResult {
    id: string;
    teamId: string;
    teamName: string;
    channelId: string;
    channelName: string;
    authorName: string;
    content: string;
    createdAt: string;
    type: Message['type'];
    isPinned: boolean;
    attachmentCount: number;
}

export function useDashboardMessages() {
    const [query, setQuery] = useState('');
    const [currentUserName, setCurrentUserName] = useState<string>();
    const [teams, setTeams] = useState<TeamSummary[]>([]);
    const [index, setIndex] = useState<SearchResult[]>([]);
    const [booting, setBooting] = useState(true);
    const [indexing, setIndexing] = useState(false);
    const [error, setError] = useState('');
    const deferredQuery = useDeferredValue(query.trim());

    useEffect(() => {
        Promise.all([authApi.getMe().catch(() => null), teamApi.getMyTeams().catch(() => null)]).then(([meRes, teamRes]) => {
            if (meRes?.success && meRes.data) setCurrentUserName((meRes.data as { username?: string }).username);
            if (teamRes?.success && Array.isArray(teamRes.data)) setTeams(teamRes.data as TeamSummary[]);
            setBooting(false);
        });
    }, []);

    useEffect(() => {
        if (deferredQuery.length < 2 || index.length || !teams.length) return;
        let active = true;
        setIndexing(true);
        buildSearchIndex(teams)
            .then((items) => active && setIndex(items))
            .catch((err: Error) => active && setError(err.message || '메시지 인덱스를 만들지 못했습니다.'))
            .finally(() => active && setIndexing(false));
        return () => {
            active = false;
        };
    }, [deferredQuery, index.length, teams]);

    const results = useMemo(() => {
        if (deferredQuery.length < 2) return [];
        const keyword = deferredQuery.toLowerCase();
        return index
            .filter((item) => [item.content, item.authorName, item.teamName, item.channelName].some((value) => value.toLowerCase().includes(keyword)))
            .slice(0, 30);
    }, [deferredQuery, index]);

    return { booting, currentUserName, error, indexing, query, results, setQuery, teamCount: teams.length };
}

async function buildSearchIndex(teams: TeamSummary[]) {
    const channelsByTeam = await Promise.all(
        teams.map(async (team) => ({ team, channels: ((await channelApi.getChannels(team.id)).data ?? []) as { id: string; name: string; type: string }[] })),
    );
    const messageBuckets = await Promise.all(
        channelsByTeam.flatMap(({ team, channels }) =>
            channels.filter((channel) => channel.type !== 'dm' && channel.type !== 'group').map(async (channel) => ({
                team,
                channel,
                messages: ((await messageApi.getMessages(channel.id, undefined, 30)).data ?? []) as Message[],
            })),
        ),
    );
    return messageBuckets.flatMap(({ team, channel, messages }) =>
        messages.map((message) => ({
            id: message.id,
            teamId: team.id,
            teamName: team.name,
            channelId: channel.id,
            channelName: channel.name,
            authorName: message.authorName || '알 수 없음',
            content: normalizeMessageContent(message),
            createdAt: message.createdAt,
            type: message.type,
            isPinned: message.isPinned,
            attachmentCount: message.attachments.length,
        })),
    );
}

function normalizeMessageContent(message: Message) {
    const stripped = message.content.replace(/<!--github:.+?-->/, '').trim();
    if (stripped) return stripped;
    if (message.attachments.length) return message.attachments.map((item) => item.name).join(', ');
    return message.type === 'system' ? '시스템 메시지' : '내용 없음';
}
