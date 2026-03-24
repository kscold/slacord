'use client';

import { useState } from 'react';
import { documentApi } from '@/lib/api-client';

const EMPTY_FORM = {
    siteUrl: 'https://',
    email: '',
    apiToken: '',
    spaceKey: '',
    rootPageId: '',
};

export function useConfluenceImport(teamId: string, onImported: () => Promise<void>) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const updateField = (key: keyof typeof EMPTY_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }));

    const submit = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await documentApi.importConfluence(teamId, {
                siteUrl: form.siteUrl.trim(),
                email: form.email.trim(),
                apiToken: form.apiToken.trim(),
                spaceKey: form.spaceKey.trim(),
                rootPageId: form.rootPageId.trim() || undefined,
            });
            await onImported();
            const importedCount = (response.data as { importedCount?: number } | undefined)?.importedCount ?? 0;
            setMessage(`${importedCount}개 문서를 Confluence에서 동기화했음.`);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Confluence 가져오기에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return { error, form, loading, message, submit, updateField };
}
