import type { Issue, IssueStatus } from '@/src/entities/issue/types';

export function getIssuesByStatus(issues: Issue[]) {
    return {
        todo: issues.filter((issue) => issue.status === 'todo'),
        in_progress: issues.filter((issue) => issue.status === 'in_progress'),
        in_review: issues.filter((issue) => issue.status === 'in_review'),
        done: issues.filter((issue) => issue.status === 'done'),
    } satisfies Record<IssueStatus, Issue[]>;
}
