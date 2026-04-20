'use client';

import { issueApi, unwrapApiData } from '@/lib/api-client';
import type { Issue, IssuePriority, IssueStatus } from '@/src/entities/issue/types';
import { useIssueStore } from './issue.store';

interface Props {
    teamId: string;
    createStatus: IssueStatus;
    issues: Issue[];
    selectedIssue: Issue | null;
    setSelectedIssueId: (issueId: string | null) => void;
}

export function useIssueBoardActions({ teamId, createStatus, issues, selectedIssue, setSelectedIssueId }: Props) {
    const { addIssue, updateIssue, removeIssue } = useIssueStore();

    return {
        handleCreate: async (data: {
            title: string;
            description?: string;
            priority: IssuePriority;
            assigneeIds?: string[];
            labels?: string[];
        }) => {
            const response = await issueApi.createIssue(teamId, { ...data, status: createStatus });
            const created = unwrapApiData<Issue>(response);
            if (created) addIssue(created);
        },

        handleUpdate: async (data: Partial<Issue>) => {
            if (!selectedIssue) return;
            const response = await issueApi.updateIssue(teamId, selectedIssue.id, data);
            const updated = unwrapApiData<Issue>(response);
            if (updated) {
                updateIssue(selectedIssue.id, updated);
                setSelectedIssueId(selectedIssue.id);
            }
        },

        handleDelete: async (issueId: string) => {
            await issueApi.deleteIssue(teamId, issueId);
            removeIssue(issueId);
            if (selectedIssue?.id === issueId) setSelectedIssueId(null);
        },

        /**
         * 드래그앤드롭 상태 이동 — optimistic update + 실패 시 롤백
         */
        handleMove: async (issueId: string, status: IssueStatus) => {
            const issue = issues.find((item) => item.id === issueId);
            if (!issue || issue.status === status) return;

            // 낙관적 업데이트
            updateIssue(issueId, { ...issue, status });

            try {
                await issueApi.updateIssue(teamId, issueId, { status });
            } catch {
                // API 실패 시 이전 상태로 롤백
                updateIssue(issueId, { ...issue, status: issue.status });
            }
        },
    };
}
