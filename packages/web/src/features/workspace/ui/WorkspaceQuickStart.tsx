'use client';

import { useQuickStart } from '../model/useQuickStart';

interface Props {
    teamId: string;
}

export function WorkspaceQuickStart({ teamId }: Props) {
    const { createDefaultChannel, loading } = useQuickStart(teamId);

    return (
        <button onClick={createDefaultChannel} disabled={loading} className="rounded-2xl bg-[#b97532] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#cf8640] disabled:opacity-50">
            {loading ? '기본 채널 준비 중...' : '첫 채널 열기'}
        </button>
    );
}
