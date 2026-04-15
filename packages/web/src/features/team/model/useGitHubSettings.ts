'use client';

import { useEffect, useMemo, useState } from 'react';
import { authApi, channelApi, teamApi } from '@/lib/api-client';
import type { Channel } from '@/src/entities/channel/types';
import { resolveCurrentTeamMember } from '@/src/entities/team/lib/access';
import type { TeamMemberSummary, TeamSettingsSummary, TeamSummary } from '@/src/entities/team/types';

const EMPTY_FORM = { repoUrl: '', webhookSecret: '', notifyChannelId: '' };

export function useGitHubSettings(teamId: string) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [canManageGithub, setCanManageGithub] = useState(false);
    const [hasStoredSecret, setHasStoredSecret] = useState(false);
    const [viewerRole, setViewerRole] = useState<TeamMemberSummary['role'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        Promise.all([authApi.getMe(), teamApi.getMembers(teamId), teamApi.getTeam(teamId), channelApi.getChannels(teamId)])
            .then(async ([meRes, membersRes, teamRes, channelRes]) => {
                if (!active) return;
                const nextChannels = ((channelRes.data ?? []) as Channel[]).filter((item) => !['dm', 'group'].includes(item.type));
                const currentUserId = (meRes.data as { id: string } | undefined)?.id ?? '';
                const members = (membersRes.data ?? []) as TeamMemberSummary[];
                const me = resolveCurrentTeamMember(members, currentUserId);
                const allowed = me?.role === 'owner' || me?.role === 'admin';
                const nextTeam = (teamRes.data ?? null) as TeamSummary | null;

                setChannels(nextChannels);
                setCanManageGithub(allowed);
                setViewerRole(me?.role ?? null);
                setHasStoredSecret(Boolean(nextTeam?.githubConfig?.hasWebhookSecret));
                setForm({
                    repoUrl: nextTeam?.githubConfig?.repoUrl ?? '',
                    webhookSecret: '',
                    notifyChannelId: nextTeam?.githubConfig?.notifyChannelId ?? nextChannels[0]?.id ?? '',
                });

                if (!allowed) return;

                const settingsRes = await teamApi.getTeamSettings(teamId);
                if (!active) return;
                const settings = (settingsRes.data ?? null) as TeamSettingsSummary | null;
                setHasStoredSecret(Boolean(settings?.githubConfig?.webhookSecret));
                setForm({
                    repoUrl: settings?.githubConfig?.repoUrl ?? '',
                    webhookSecret: settings?.githubConfig?.webhookSecret ?? '',
                    notifyChannelId: settings?.githubConfig?.notifyChannelId ?? nextChannels[0]?.id ?? '',
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
        if (!canManageGithub) {
            setError('owner/admin만 GitHub 설정을 변경할 수 있습니다.');
            return;
        }
        setSaving(true);
        setSaved(false);
        setError('');
        try {
            const response = await teamApi.updateGithubConfig(teamId, form);
            const settings = (response.data ?? null) as TeamSettingsSummary | null;
            setHasStoredSecret(Boolean(settings?.githubConfig?.webhookSecret));
            setForm({
                repoUrl: settings?.githubConfig?.repoUrl ?? form.repoUrl,
                webhookSecret: settings?.githubConfig?.webhookSecret ?? form.webhookSecret,
                notifyChannelId: settings?.githubConfig?.notifyChannelId ?? form.notifyChannelId,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err: any) {
            setError(err.message ?? '저장 실패');
        } finally {
            setSaving(false);
        }
    };

    return { canManageGithub, channels, error, form, generateSecret, hasStoredSecret, loading, save, saved, saving, selectedChannel, updateField, viewerRole };
}
