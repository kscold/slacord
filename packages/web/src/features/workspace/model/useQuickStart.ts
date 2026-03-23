'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { channelApi } from '@/lib/api-client';

export function useQuickStart(teamId: string) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const createDefaultChannel = async () => {
        setLoading(true);
        try {
            const response = await channelApi.createChannel(teamId, { name: 'general', description: '기본 대화 채널' });
            const channelId = response.data?.id;
            if (channelId) {
                router.push(`/${teamId}/channel/${channelId}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return { createDefaultChannel, loading };
}
