import type { Issue, IssuePriority } from '@/src/entities/issue/types';

const PRIORITY_COLORS: Record<IssuePriority, string> = {
    low: 'text-text-tertiary border-text-tertiary/30',
    medium: 'text-blue-400 border-blue-400/30',
    high: 'text-yellow-400 border-yellow-400/30',
    urgent: 'text-red-400 border-red-400/30',
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
    low: '낮음',
    medium: '보통',
    high: '높음',
    urgent: '긴급',
};

interface Props {
    issue: Issue;
    onClick: (issue: Issue) => void;
}

export function IssueCard({ issue, onClick }: Props) {
    const priorityClass = PRIORITY_COLORS[issue.priority];

    return (
        <button
            onClick={() => onClick(issue)}
            className="w-full text-left bg-bg-secondary hover:bg-bg-hover border border-border-primary rounded-lg p-3 transition-colors group"
        >
            <p className="text-sm text-white font-medium mb-2 line-clamp-2">{issue.title}</p>
            <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs border rounded-full px-2 py-0.5 ${priorityClass}`}>
                    {PRIORITY_LABELS[issue.priority]}
                </span>
                {issue.labels.slice(0, 2).map((label) => (
                    <span key={label} className="text-xs bg-slack-green/10 text-slack-green border border-slack-green/20 rounded-full px-2 py-0.5">
                        {label}
                    </span>
                ))}
            </div>
        </button>
    );
}
