'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { channelApi, teamApi } from '@/lib/api-client';

function slugify(value: string) {
    return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function useCreateWorkspace() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const createWorkspace = async (name: string, description: string) => {
        setError('');
        setLoading(true);
        try {
            const created = await teamApi.createTeam({ name, slug: slugify(name), description });
            const teamId = created.data?.id;
            if (!created.success || !teamId) throw new Error('워크스페이스 생성에 실패했습니다.');
            const channel = await channelApi.createChannel(teamId, { name: 'general', description: '기본 대화 채널' });
            const channelId = channel.data?.id;
            router.push(channelId ? `/${teamId}/channel/${channelId}` : `/${teamId}`);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : '워크스페이스 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return { createWorkspace, error, loading };
}
