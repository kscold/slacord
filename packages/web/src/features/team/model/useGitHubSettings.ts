'use client';

import { useEffect, useMemo, useState } from 'react';
import { channelApi, teamApi } from '@/lib/api-client';
import type { Channel } from '@/src/entities/channel/types';
import type { TeamSummary } from '@/src/entities/team/types';

const EMPTY_FORM = { repoUrl: '', webhookSecret: '', notifyChannelId: '' };

export function useGitHubSettings(teamId: string) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([teamApi.getTeam(teamId), channelApi.getChannels(teamId)])
            .then(([teamRes, channelRes]) => {
                if (!active) return;
                const nextTeam = (teamRes.data ?? null) as TeamSummary | null;
                const nextChannels = ((channelRes.data ?? []) as Channel[]).filter((item) => !['dm', 'group'].includes(item.type));
                setChannels(nextChannels);
                setForm({
                    repoUrl: nextTeam?.githubConfig?.repoUrl ?? '',
                    webhookSecret: nextTeam?.githubConfig?.webhookSecret ?? '',
                    notifyChannelId: nextTeam?.githubConfig?.notifyChannelId ?? nextChannels[0]?.id ?? '',
                });
            })
            .catch((err: Error) => active && setError(err.message || '설정을 불러오지 못했습니다.'))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [teamId]);

    const selectedChannel = useMemo(
        () => channels.find((item) => item.id === form.notifyChannelId) ?? null,
        [channels, form.notifyChannelId],
    );

    const updateField = (key: keyof typeof EMPTY_FORM, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const generateSecret = () => {
        const bytes = new Uint8Array(24);
        crypto.getRandomValues(bytes);
        updateField('webhookSecret', Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join(''));
    };

    const save = async () => {
        setSaving(true);
        setSaved(false);
        setError('');
        try {
            await teamApi.updateGithubConfig(teamId, form);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err: any) {
            setError(err.message ?? '저장 실패');
        } finally {
            setSaving(false);
        }
    };

    return { channels, error, form, generateSecret, loading, save, saved, saving, selectedChannel, updateField };
}
