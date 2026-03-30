'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { issueApi, teamApi } from '@/lib/api-client';
import type { Issue, IssuePriority, IssueStatus } from '@/src/entities/issue/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import { useIssueStore } from './issue.store';
import { useIssueBoardFilters } from './useIssueBoardFilters';

export function useIssueBoard(teamId: string) {
    const searchParams = useSearchParams();
    const { issues, setIssues, addIssue, updateIssue, removeIssue } = useIssueStore();
    const [members, setMembers] = useState<TeamMemberSummary[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [createStatus, setCreateStatus] = useState<IssueStatus>('todo');
    const filters = useIssueBoardFilters();

    const loadIssues = useCallback(async () => {
        const response = await issueApi.getIssues(teamId, {
            query: filters.query,
            assigneeId: filters.assigneeId || undefined,
            status: filters.statusFilter === 'all' ? undefined : filters.statusFilter,
        });
        if (response.success && Array.isArray(response.data)) {
            setIssues(response.data as Issue[]);
        }
    }, [filters.assigneeId, filters.query, filters.statusFilter, setIssues, teamId]);

    useEffect(() => {
        teamApi.getMembers(teamId).then((response) => {
            if (response.success && Array.isArray(response.data)) {
                setMembers(response.data as TeamMemberSummary[]);
            }
        });
    }, [teamId]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadIssues();
        }, filters.query ? 180 : 0);
        return () => window.clearTimeout(timeout);
    }, [filters.query, loadIssues]);

    useEffect(() => {
        const focusIssueId = searchParams.get('issue');
        if (!focusIssueId) return;
        const found = issues.find((issue) => issue.id === focusIssueId);
        if (found) setSelectedIssue(found);
    }, [issues, searchParams]);

    const issuesByStatus = useMemo(
        () => ({
            todo: issues.filter((issue) => issue.status === 'todo'),
            in_progress: issues.filter((issue) => issue.status === 'in_progress'),
            in_review: issues.filter((issue) => issue.status === 'in_review'),
            done: issues.filter((issue) => issue.status === 'done'),
        }),
        [issues],
    );

    const handleCreate = async (data: { title: string; description?: string; priority: IssuePriority; assigneeIds?: string[] }) => {
        const response = await issueApi.createIssue(teamId, { ...data, status: createStatus } as any);
        if (response.success && response.data) addIssue(response.data as Issue);
    };

    const handleUpdate = async (data: Partial<Issue>) => {
        if (!selectedIssue) return;
        const response = await issueApi.updateIssue(teamId, selectedIssue.id, data);
        if (response.success && response.data) {
            updateIssue(selectedIssue.id, response.data as Issue);
            setSelectedIssue(response.data as Issue);
        }
    };

    const handleDelete = async (issueId: string) => {
        await issueApi.deleteIssue(teamId, issueId);
        removeIssue(issueId);
        if (selectedIssue?.id === issueId) setSelectedIssue(null);
    };

    const handleMove = async (issueId: string, status: IssueStatus) => {
        const issue = issues.find((item) => item.id === issueId);
        if (!issue || issue.status === status) return;
        updateIssue(issueId, { ...issue, status });
        await issueApi.updateIssue(teamId, issueId, { status });
    };

    return {
        createStatus,
        handleCreate,
        handleDelete,
        handleMove,
        handleUpdate,
        issuesByStatus,
        members,
        query: filters.query,
        selectedIssue,
        setAssigneeId: filters.setAssigneeId,
        setCreateStatus,
        setQuery: filters.setQuery,
        setSelectedIssue,
        setShowCreate,
        setStatusFilter: filters.setStatusFilter,
        showCreate,
        assigneeId: filters.assigneeId,
        statusFilter: filters.statusFilter,
    };
}
