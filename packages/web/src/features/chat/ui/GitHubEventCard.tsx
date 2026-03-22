import type { GitHubEventMeta } from '@/src/entities/message/types';

const EVENT_LABELS: Record<string, string> = {
    pr_opened: 'PR 오픈',
    pr_merged: 'PR 병합',
    pr_closed: 'PR 닫힘',
    pr_review_requested: '리뷰 요청',
    pr_approved: 'PR 승인',
    pr_changes_requested: '변경 요청',
    ci_passed: 'CI 통과',
    ci_failed: 'CI 실패',
};

const EVENT_COLORS: Record<string, string> = {
    pr_opened: 'border-blue-500/40 bg-blue-500/5',
    pr_merged: 'border-purple-500/40 bg-purple-500/5',
    pr_closed: 'border-red-500/40 bg-red-500/5',
    pr_approved: 'border-slack-green/40 bg-slack-green/5',
    ci_passed: 'border-slack-green/40 bg-slack-green/5',
    ci_failed: 'border-red-500/40 bg-red-500/5',
    pr_review_requested: 'border-yellow-500/40 bg-yellow-500/5',
    pr_changes_requested: 'border-orange-500/40 bg-orange-500/5',
};

interface Props {
    meta: GitHubEventMeta;
}

export function GitHubEventCard({ meta }: Props) {
    const colorClass = EVENT_COLORS[meta.eventType] ?? 'border-border-primary bg-bg-tertiary';
    const label = EVENT_LABELS[meta.eventType] ?? meta.eventType;

    return (
        <div className={`rounded-lg border px-4 py-3 text-sm my-1 ${colorClass}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">{label}</span>
                    <p className="text-white font-medium truncate">
                        {meta.prNumber ? `#${meta.prNumber}: ${meta.prTitle}` : meta.repo}
                    </p>
                    <p className="text-text-tertiary text-xs mt-0.5">{meta.repo} · by {meta.actor}</p>
                </div>
                {meta.prUrl && (
                    <a
                        href={meta.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs text-slack-green hover:underline"
                    >
                        GitHub →
                    </a>
                )}
            </div>
        </div>
    );
}
