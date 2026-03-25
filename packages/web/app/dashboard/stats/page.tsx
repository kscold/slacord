'use client';

import { useDashboardStats } from '@/src/features/dashboard/model/useDashboardStats';
import { DashboardShell } from '@/src/widgets/dashboard/ui/DashboardShell';
import { StatsGrid } from '@/src/widgets/dashboard/ui/stats/StatsGrid';
import { WorkspaceStatsList } from '@/src/widgets/dashboard/ui/stats/WorkspaceStatsList';

export default function StatsPage() {
    const stats = useDashboardStats();

    return (
        <DashboardShell title="활동 통계" description="워크스페이스, 채널, 최근 메시지 흐름을 한눈에 보고 다음 작업으로 바로 이어질 수 있도록 구성했습니다." currentUserName={stats.currentUserName}>
            <div className="space-y-6">
                {stats.loading ? <div className="rounded-[28px] border border-border-primary bg-bg-secondary px-6 py-16 text-center text-sm text-text-secondary">통계 집계 중...</div> : null}
                {!stats.loading ? <StatsGrid totals={stats.totals} /> : null}
                {!stats.loading ? <WorkspaceStatsList stats={stats.stats} /> : null}
            </div>
        </DashboardShell>
    );
}
