'use client';

import { useState } from 'react';
import { useIssueBoardFilters } from './useIssueBoardFilters';
import { useIssueBoardActions } from './useIssueBoardActions';
import { useIssueBoardData } from './useIssueBoardData';
import type { IssueStatus } from '@/src/entities/issue/types';

export function useIssueBoard(teamId: string) {
    const [showCreate, setShowCreate] = useState(false);
    const [createStatus, setCreateStatus] = useState<IssueStatus>('todo');
    const filters = useIssueBoardFilters();
    const board = useIssueBoardData({ teamId, filters });
    const actions = useIssueBoardActions({
        teamId,
        createStatus,
        issues: board.issues,
        selectedIssue: board.selectedIssue,
        setSelectedIssueId: board.setSelectedIssueId,
    });

    return {
        createStatus,
        ...actions,
        issuesByStatus: board.issuesByStatus,
        members: board.members,
        query: filters.query,
        selectedIssue: board.selectedIssue,
        setAssigneeId: filters.setAssigneeId,
        setCreateStatus,
        setQuery: filters.setQuery,
        setSelectedIssue: (issue: { id: string } | null) => board.setSelectedIssueId(issue?.id ?? null),
        setShowCreate,
        setStatusFilter: filters.setStatusFilter,
        showCreate,
        assigneeId: filters.assigneeId,
        statusFilter: filters.statusFilter,
    };
}
