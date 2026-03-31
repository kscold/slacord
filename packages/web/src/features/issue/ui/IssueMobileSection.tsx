import type { IssueStatus } from '@/src/entities/issue/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import { ISSUE_STATUS_LABELS } from '@/src/entities/issue/types';
import { IssueCard } from './IssueCard';

interface Props {
    issues: any[];
    members: TeamMemberSummary[];
    onAddClick: () => void;
    onCardClick: (issue: any) => void;
    status: IssueStatus;
}

export function IssueMobileSection({ issues, members, onAddClick, onCardClick, status }: Props) {
    return (
        <section className="rounded-2xl border border-border-primary bg-bg-secondary p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-white">{ISSUE_STATUS_LABELS[status]}</h3>
                    <p className="mt-1 text-xs text-text-tertiary">{issues.length}개</p>
                </div>
                <button
                    type="button"
                    onClick={onAddClick}
                    className="rounded-full border border-border-primary px-3 py-1.5 text-xs text-text-secondary transition hover:border-brand-300/40 hover:text-white"
                >
                    이슈 추가
                </button>
            </div>
            <div className="space-y-2">
                {issues.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border-primary px-4 py-6 text-center text-xs text-text-tertiary">아직 등록된 이슈가 없습니다.</p>
                ) : (
                    issues.map((issue, index) => (
                        <IssueCard key={issue.id} draggable={false} issue={issue} index={index} members={members} onClick={onCardClick} />
                    ))
                )}
            </div>
        </section>
    );
}
