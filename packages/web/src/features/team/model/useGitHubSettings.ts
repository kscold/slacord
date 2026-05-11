'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { teamApi, unwrapApiData } from '@/lib/api-client';
import type { Channel } from '@/src/entities/channel/types';
import type { TeamMemberSummary, TeamSettingsSummary, TeamSummary } from '@/src/entities/team/types';
import { useTeamWorkspaceData } from './useTeamWorkspaceData';

const EMPTY_FORM = { repoUrl: '', webhookSecret: '', notifyChannelId: '' };

export function useGitHubSettings(teamId: string) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [hasStoredSecret, setHasStoredSecret] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const syncKeyRef = useRef('');
    const workspace = useTeamWorkspaceData(teamId, { includeSettings: true });

    const channels = useMemo(
        () => workspace.channels.filter((item) => !['dm', 'group'].includes(item.type)) as Channel[],
        [workspace.channels],
    );
    const canManageGithub = workspace.currentMember?.role === 'owner' || workspace.currentMember?.role === 'admin';
    const viewerRole = workspace.currentMember?.role ?? null;
    const loading = workspace.isInitialLoading || (canManageGithub && workspace.isInitialSettingsLoading);
    const error = saveError || workspace.error || (canManageGithub ? workspace.settingsError : '');

    useEffect(() => {
        const publicConfig = (workspace.team as TeamSummary | null)?.githubConfig ?? null;
        const settingsConfig = (workspace.settings as TeamSettingsSummary | null)?.githubConfig ?? null;
        const source = canManageGithub ? settingsConfig : publicConfig;
        const nextForm = {
            repoUrl: source?.repoUrl ?? '',
            webhookSecret: canManageGithub ? (settingsConfig?.webhookSecret ?? '') : '',
            notifyChannelId: source?.notifyChannelId ?? channels[0]?.id ?? '',
        };
        const nextHasSecret = canManageGithub
            ? Boolean(settingsConfig?.webhookSecret)
            : Boolean(publicConfig?.hasWebhookSecret);
        const nextSyncKey = JSON.stringify(nextForm);

        setHasStoredSecret(nextHasSecret);
        if (syncKeyRef.current !== nextSyncKey) {
            syncKeyRef.current = nextSyncKey;
            setForm(nextForm);
        }
    }, [canManageGithub, channels, workspace.settings, workspace.team]);

    useEffect(
        () => () => {
            if (savedTimerRef.current) {
                clearTimeout(savedTimerRef.current);
            }
        },
        [],
    );

    const announceSaved = () => {
        setSaved(true);
        if (savedTimerRef.current) {
            clearTimeout(savedTimerRef.current);
        }
        savedTimerRef.current = setTimeout(() => setSaved(false), 4000);
    };

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
            setSaveError('owner/admin만 GitHub 설정을 변경할 수 있습니다.');
            return;
        }
        setSaving(true);
        setSaved(false);
        setSaveError('');
        try {
            const response = await teamApi.updateGithubConfig(teamId, form);
            const settings = unwrapApiData<TeamSettingsSummary>(response);
            setHasStoredSecret(Boolean(settings?.githubConfig?.webhookSecret));
            const nextForm = {
                repoUrl: settings?.githubConfig?.repoUrl ?? form.repoUrl,
                webhookSecret: settings?.githubConfig?.webhookSecret ?? form.webhookSecret,
                notifyChannelId: settings?.githubConfig?.notifyChannelId ?? form.notifyChannelId,
            };
            syncKeyRef.current = JSON.stringify(nextForm);
            setForm(nextForm);
            announceSaved();
            await Promise.allSettled([workspace.refreshBase(), workspace.refreshSettings()]);
        } catch (err: any) {
            setSaveError(err.message ?? '저장 실패');
        } finally {
            setSaving(false);
        }
    };

    return {
        canManageGithub,
        channels,
        error,
        form,
        generateSecret,
        hasStoredSecret,
        loading,
        save,
        saved,
        saving,
        selectedChannel,
        updateField,
        viewerRole,
    };
}
