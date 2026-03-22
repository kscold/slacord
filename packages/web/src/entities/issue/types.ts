export type IssueStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Issue {
    id: string;
    teamId: string;
    title: string;
    description?: string;
    status: IssueStatus;
    priority: IssuePriority;
    assigneeIds: string[];
    labels: string[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
    todo: '할 일',
    in_progress: '진행 중',
    in_review: '리뷰 중',
    done: '완료',
};
