import type { Issue, IssueStatus } from '@/src/entities/issue/types';
import { IssueCard } from './IssueCard';

interface Props {
    status: IssueStatus;
    label: string;
    issues: Issue[];
    onCardClick: (issue: Issue) => void;
    onAddClick: () => void;
}

const COLUMN_HEADER_COLORS: Record<IssueStatus, string> = {
    todo: 'text-text-secondary',
    in_progress: 'text-blue-400',
    in_review: 'text-yellow-400',
    done: 'text-slack-green',
};

export function KanbanColumn({ status, label, issues, onCardClick, onAddClick }: Props) {
    return (
        <div className="flex flex-col bg-bg-secondary rounded-xl border border-border-primary min-w-64 w-64 shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary">
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${COLUMN_HEADER_COLORS[status]}`}>{label}</span>
                    <span className="text-xs text-text-tertiary bg-bg-tertiary rounded-full px-2 py-0.5">{issues.length}</span>
                </div>
                <button
                    onClick={onAddClick}
                    className="text-text-tertiary hover:text-white hover:bg-bg-hover rounded p-0.5 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-32">
                {issues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} onClick={onCardClick} />
                ))}
                {issues.length === 0 && (
                    <p className="text-xs text-text-tertiary text-center py-4">이슈 없음</p>
                )}
            </div>
        </div>
    );
}
