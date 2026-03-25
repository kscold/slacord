'use client';

import { useState } from 'react';
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

    const submit = async () => {
        setSaving(true);
        setError('');
        try {
            const response = await teamApi.importDiscordGuild(teamId, {
                botToken: form.botToken.trim(),
                guildId: form.guildId.trim(),
                channelIds: form.channelIds.split(',').map((item) => item.trim()).filter(Boolean),
            });
            setSummary((response.data ?? null) as DiscordImportSummary | null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Discord 가져오기에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return { error, form, saving, submit, summary, updateField };
}
