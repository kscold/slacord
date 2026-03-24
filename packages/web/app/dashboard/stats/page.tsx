'use client';

import Link from 'next/link';
import { DashboardSidebar } from '@/src/widgets/dashboard/ui/DashboardSidebar';

const STAT_CARDS = [
    { label: '전체 메시지', value: '-', sub: '준비 중' },
    { label: '활성 채널', value: '-', sub: '준비 중' },
    { label: '팀 멤버', value: '-', sub: '준비 중' },
    { label: '오늘 메시지', value: '-', sub: '준비 중' },
];

export default function StatsPage() {
    return (
        <div className="min-h-screen flex bg-bg-primary">
            <DashboardSidebar />
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white">통계</h2>
                        <p className="text-text-secondary mt-2">팀 활동 현황을 한눈에 확인합니다</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {STAT_CARDS.map((card) => (
                            <div key={card.label} className="bg-bg-secondary rounded-2xl border border-border-primary p-6">
                                <p className="text-text-tertiary text-sm mb-1">{card.label}</p>
                                <p className="text-4xl font-bold text-white">{card.value}</p>
                                <p className="text-text-muted text-xs mt-2">{card.sub}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center py-20 bg-bg-secondary rounded-2xl border border-border-primary">
                        <svg className="w-16 h-16 mx-auto text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-text-secondary text-lg font-semibold">통계 기능 준비 중</p>
                        <p className="text-text-muted text-sm mt-2">팀과 채널을 생성하면 활동 통계가 표시됩니다</p>
                        <Link href="/dashboard" className="inline-block mt-6 px-6 py-3 bg-[#b97532]/10 border border-[#b97532]/30 text-[#d6b08a] rounded-xl font-medium hover:bg-[#b97532]/20 transition-colors">
                            대시보드로 돌아가기
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}