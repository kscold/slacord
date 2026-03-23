import Link from 'next/link';
import type { TeamSummary } from '@/src/entities/team/types';

interface Props {
    team: TeamSummary;
}

export function WorkspaceCard({ team }: Props) {
    return (
        <Link href={`/${team.id}`} className="block rounded-[24px] border border-border-primary bg-bg-secondary p-6 transition hover:border-[#d6b08a]/50 hover:bg-bg-hover">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#d6b08a]">{team.slug}</p>
                    <h2 className="mt-2 text-xl font-bold text-white">{team.name}</h2>
                </div>
                <span className="rounded-full bg-[#2a1d12] px-3 py-1 text-xs font-medium text-[#f0d6b4]">{team.memberCount}명</span>
            </div>
            <p className="mt-4 min-h-12 text-sm leading-6 text-text-secondary">{team.description || '워크스페이스 설명이 아직 없습니다.'}</p>
            <div className="mt-6 flex items-center justify-between text-xs text-text-tertiary">
                <span>{team.githubConfig?.repoUrl ? 'GitHub 연결됨' : 'GitHub 미연결'}</span>
                <span>{new Date(team.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
        </Link>
    );
}
