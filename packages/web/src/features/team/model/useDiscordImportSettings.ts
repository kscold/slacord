'use client';

import { useEffect, useState } from 'react';
import { teamApi } from '@/lib/api-client';
import type { DiscordImportSummary } from '@/src/entities/team/types';

const EMPTY_FORM = { botToken: '', guildId: '', channelIds: '' };

export function useDiscordImportSettings(teamId: string) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [summary, setSummary] = useState<DiscordImportSummary | null>(null);
    const [error, setError] = useState('');

    const updateField = (key: keyof typeof EMPTY_FORM, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = window.localStorage.getItem(`slacord:discord-import:${teamId}`);
        if (!saved) return;
        try {
            const parsed = JSON.parse(saved) as Pick<typeof EMPTY_FORM, 'guildId' | 'channelIds'>;
            setForm((current) => ({ ...current, guildId: parsed.guildId ?? '', channelIds: parsed.channelIds ?? '' }));
        } catch {
            window.localStorage.removeItem(`slacord:discord-import:${teamId}`);
        }
    }, [teamId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(
            `slacord:discord-import:${teamId}`,
            JSON.stringify({ guildId: form.guildId, channelIds: form.channelIds }),
        );
    }, [form.channelIds, form.guildId, teamId]);

    const submit = async () => {
        if (!form.guildId.trim()) {
            setError('Discord Guild ID를 먼저 입력해 주세요.');
            return;
        }
        if (!form.botToken.trim()) {
            setError('Discord Bot Token을 먼저 입력해 주세요.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const response = await teamApi.importDiscordGuild(teamId, {
                botToken: form.botToken.trim(),
                guildId: form.guildId.trim(),
                channelIds: form.channelIds.split(',').map((item) => item.trim()).filter(Boolean),
            });
            setSummary((response.data ?? null) as DiscordImportSummary | null);
            setForm((current) => ({ ...current, botToken: '' }));
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Discord 가져오기에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return { error, form, saving, submit, summary, updateField };
}
