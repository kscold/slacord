'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TeamDashboardRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.id as string;

    useEffect(() => {
        if (teamId) {
            router.replace(`/${teamId}`);
        }
    }, [router, teamId]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-secondary">
            워크스페이스로 이동 중입니다.
        </div>
    );
}
