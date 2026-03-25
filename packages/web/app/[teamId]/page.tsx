import Link from 'next/link';
import { fetchWorkspaceLayoutData } from '@/lib/server-workspace-data';
import { WorkspaceQuickStart } from '@/src/features/workspace/ui/WorkspaceQuickStart';

interface Props {
    params: Promise<{ teamId: string }>;
}

export default async function TeamHomePage({ params }: Props) {
    const { teamId } = await params;
    const { teamName, channels } = await fetchWorkspaceLayoutData(teamId).catch(() => ({ teamName: '워크스페이스', channels: [] }));
    const firstChannel = channels[0];
    const workspaceChannels = channels.filter((channel) => channel.type === 'public' || channel.type === 'private');
    const directChannels = channels.filter((channel) => channel.type === 'dm' || channel.type === 'group');

    return (
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
                <section className="rounded-[28px] border border-border-primary bg-bg-secondary p-6 sm:p-8">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#d6b08a]">Workspace Home</p>
                    <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">{teamName} 작업 공간</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">채널 대화에서 이슈, 문서, 공지까지 자연스럽게 이어질 수 있도록 자주 쓰는 흐름을 한 화면에 모았습니다.</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        {firstChannel ? <Link href={`/${teamId}/channel/${firstChannel.id}`} className="rounded-xl bg-[#b97532] px-5 py-3 text-sm font-semibold text-white">대화 시작하기</Link> : <WorkspaceQuickStart teamId={teamId} />}
                        <Link href={`/${teamId}/issues`} className="rounded-xl border border-border-primary px-5 py-3 text-sm font-medium text-white">이슈 보기</Link>
                        <Link href={`/${teamId}/docs`} className="rounded-xl border border-border-primary px-5 py-3 text-sm font-medium text-white">문서 보기</Link>
                        <Link href="/dashboard" className="rounded-xl border border-border-primary px-5 py-3 text-sm font-medium text-text-secondary">대시보드 열기</Link>
                    </div>
                </section>

                <section className="rounded-[28px] border border-border-primary bg-bg-secondary p-6 sm:p-8">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#d6b08a]">Snapshot</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        <StatCard label="채널" value={String(workspaceChannels.length)} />
                        <StatCard label="DM / 소그룹" value={String(directChannels.length)} />
                        <StatCard label="첫 진입 채널" value={firstChannel ? `#${firstChannel.name}` : '없음'} />
                    </div>
                </section>
            </div>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <QuickPanel href={`/${teamId}/channel/${firstChannel?.id ?? ''}`} label="채널" title={firstChannel ? `# ${firstChannel.name}` : '채널 만들기'} description="대화를 시작하고 실시간으로 협업합니다." disabled={!firstChannel} />
                <QuickPanel href={`/${teamId}/issues`} label="이슈" title="작업 흐름 보기" description="해야 할 일과 진행 상태를 빠르게 확인합니다." />
                <QuickPanel href={`/${teamId}/docs`} label="문서" title="문서/위키 열기" description="회의록, 가이드, 기록을 바로 이어서 확인합니다." />
                <QuickPanel href={`/${teamId}/announcements`} label="공지" title="팀 공지 확인" description="중요 전달사항과 운영 공지를 한 곳에서 봅니다." />
            </section>
        </div>
    );
}

function QuickPanel({ description, disabled, href, label, title }: { description: string; disabled?: boolean; href: string; label: string; title: string }) {
    const base = 'rounded-[24px] border border-border-primary bg-bg-secondary p-5 transition';
    if (disabled) return <div className={`${base} opacity-70`}><p className="text-xs uppercase tracking-[0.18em] text-[#d6b08a]">{label}</p><h2 className="mt-4 text-xl font-bold text-white">{title}</h2><p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p></div>;
    return <Link href={href} className={`${base} hover:border-[#d6b08a]/40 hover:bg-bg-hover`}><p className="text-xs uppercase tracking-[0.18em] text-[#d6b08a]">{label}</p><h2 className="mt-4 text-xl font-bold text-white">{title}</h2><p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p></Link>;
}

function StatCard({ label, value }: { label: string; value: string }) {
    return <div className="rounded-2xl border border-border-primary bg-[#120f0b] px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">{label}</p><p className="mt-3 text-2xl font-bold text-white">{value}</p></div>;
}
