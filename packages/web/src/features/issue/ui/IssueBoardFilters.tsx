'use client';

import type { IssueStatus } from '@/src/entities/issue/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';

interface Props {
    query: string;
    assigneeId: string;
    status: IssueStatus | 'all';
    members: TeamMemberSummary[];
    onQueryChange: (value: string) => void;
    onAssigneeChange: (value: string) => void;
    onStatusChange: (value: IssueStatus | 'all') => void;
    onReset: () => void;
}

export function IssueBoardFilters(props: Props) {
    return (
        <div className="flex flex-col gap-3 border-b border-border-primary px-6 py-4 lg:flex-row lg:items-center">
            <input
                value={props.query}
                onChange={(event) => props.onQueryChange(event.target.value)}
                placeholder="이슈 제목이나 설명을 검색해 보세요"
                className="min-w-0 flex-1 rounded-xl border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm text-white outline-none transition focus:border-brand-300/60"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
                <select
                    value={props.assigneeId}
                    onChange={(event) => props.onAssigneeChange(event.target.value)}
                    className="rounded-xl border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm text-white outline-none transition focus:border-brand-300/60"
                >
                    <option value="">모든 담당자</option>
                    {props.members.map((member) => (
                        <option key={member.userId} value={member.userId}>
                            {member.user?.username ?? member.userId.slice(-4)}
                        </option>
                    ))}
                </select>
                <select
                    value={props.status}
                    onChange={(event) => props.onStatusChange(event.target.value as IssueStatus | 'all')}
                    className="rounded-xl border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm text-white outline-none transition focus:border-brand-300/60"
                >
                    <option value="all">모든 상태</option>
                    <option value="todo">할 일</option>
                    <option value="in_progress">진행 중</option>
                    <option value="in_review">리뷰 중</option>
                    <option value="done">완료</option>
                </select>
                <button
                    type="button"
                    onClick={props.onReset}
                    className="rounded-xl border border-border-primary px-4 py-2.5 text-sm text-text-secondary transition hover:border-brand-300/40 hover:text-white"
                >
                    초기화
                </button>
            </div>
        </div>
    );
}
