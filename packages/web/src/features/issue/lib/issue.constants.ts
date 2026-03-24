import type { IssuePriority, IssueStatus } from '@/src/entities/issue/types';

export const PRIORITIES: IssuePriority[] = ['low', 'medium', 'high', 'urgent'];
export const PRIORITY_LABELS: Record<IssuePriority, string> = { low: '낮음', medium: '보통', high: '높음', urgent: '긴급' };
export const STATUSES: IssueStatus[] = ['todo', 'in_progress', 'in_review', 'done'];
export const STATUS_LABELS: Record<IssueStatus, string> = { todo: '할 일', in_progress: '진행 중', in_review: '리뷰 중', done: '완료' };
