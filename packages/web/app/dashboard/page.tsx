'use client';

import Link from 'next/link';
import { useDashboardHome } from '@/src/features/dashboard/model/useDashboardHome';
import { DashboardShell } from '@/src/widgets/dashboard/ui/DashboardShell';
import { EmptyWorkspaceState } from '@/src/widgets/dashboard/ui/EmptyWorkspaceState';
import { WorkspaceCard } from '@/src/widgets/dashboard/ui/WorkspaceCard';

export default function DashboardPage() {
    const { currentUser, loading, primaryTeam, teams } = useDashboardHome();

    return (
        <DashboardShell title="워크스페이스" description="팀별 대화, 문서, 이슈 흐름을 한 화면에서 이어서 관리할 수 있도록 정리한 운영 허브입니다." currentUserName={currentUser?.username}>
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d6b08a] border-t-transparent" />
                </div>
            ) : teams.length === 0 ? (
                <EmptyWorkspaceState />
            ) : (
                <div className="space-y-6">
                    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
                        <div className="rounded-[28px] border border-border-primary bg-bg-secondary p-6 sm:p-7">
                            <p className="text-xs uppercase tracking-[0.2em] text-[#d6b08a]">Continue</p>
                            <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-white sm:text-3xl">{primaryTeam.name}에서 바로 이어서 작업</h2>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">최근 사용한 워크스페이스를 바로 열고, 대화와 문서, 이슈 흐름으로 곧바로 들어갈 수 있습니다.</p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link href={`/${primaryTeam.id}`} className="rounded-xl bg-[#b97532] px-5 py-3 text-sm font-semibold text-white">워크스페이스 열기</Link>
                                <Link href={`/${primaryTeam.id}/docs`} className="rounded-xl border border-border-primary px-5 py-3 text-sm font-medium text-white">문서 보기</Link>
                                <Link href={`/${primaryTeam.id}/issues`} className="rounded-xl border border-border-primary px-5 py-3 text-sm font-medium text-white">이슈 보기</Link>
                            </div>
                        </div>
                        <div className="rounded-[28px] border border-border-primary bg-bg-secondary p-6 sm:p-7">
                            <p className="text-xs uppercase tracking-[0.2em] text-[#d6b08a]">Quick Action</p>
                            <div className="mt-5 grid gap-3">
                                <QuickLink href="/dashboard/messages" title="메시지 검색" description="최근 대화와 멘션을 한 번에 찾습니다." />
                                <QuickLink href="/dashboard/stats" title="활동 통계" description="워크스페이스별 메시지 흐름과 활동량을 봅니다." />
                                <QuickLink href="/dashboard/teams/new" title="새 팀 만들기" description="새 워크스페이스를 열고 바로 협업을 시작합니다." />
                            </div>
                        </div>
                    </section>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {teams.map((team) => <WorkspaceCard key={team.id} team={team} />)}
                    </div>
                </div>
            )}
        </DashboardShell>
    );
}

function QuickLink({ description, href, title }: { description: string; href: string; title: string }) {
    return (
        <Link href={href} className="rounded-2xl border border-border-primary bg-[#120f0b] px-4 py-4 transition hover:border-[#d6b08a]/40 hover:bg-bg-hover">
            <p className="font-medium text-white">{title}</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        </Link>
    );
}
