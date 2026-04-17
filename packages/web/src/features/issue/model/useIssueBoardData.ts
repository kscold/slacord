'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { issueApi } from '@/lib/api-client';
import { useIssueStore } from './issue.store';
import { getIssuesByStatus } from './getIssuesByStatus';
import type { IssueStatus } from '@/src/entities/issue/types';
import { useTeamWorkspaceData } from '@/src/features/team/model/useTeamWorkspaceData';

interface IssueBoardFiltersState {
    query: string;
    assigneeId: string;
    statusFilter: IssueStatus | 'all';
}

interface Props {
    teamId: string;
    filters: IssueBoardFiltersState;
}

export function useIssueBoardData({ teamId, filters }: Props) {
    const searchParams = useSearchParams();
    const { issues, setIssues, setLoading } = useIssueStore();
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const workspace = useTeamWorkspaceData(teamId);

    const loadIssues = useCallback(async () => {
        setLoading(true);
        try {
            const response = await issueApi.getIssues(teamId, {
                query: filters.query,
                assigneeId: filters.assigneeId || undefined,
                status: filters.statusFilter === 'all' ? undefined : filters.statusFilter,
            });
            if (response.success && Array.isArray(response.data)) {
                setIssues(response.data);
            }
        } finally {
            setLoading(false);
        }
    }, [filters.assigneeId, filters.query, filters.statusFilter, setIssues, setLoading, teamId]);

    useEffect(() => {
        const timeout = window.setTimeout(
            () => {
                void loadIssues();
            },
            filters.query ? 180 : 0,
        );

        return () => window.clearTimeout(timeout);
    }, [filters.query, loadIssues]);

    useEffect(() => {
        const focusIssueId = searchParams.get('issue');
        if (focusIssueId) setSelectedIssueId(focusIssueId);
    }, [searchParams]);

    const selectedIssue = useMemo(
        () => issues.find((issue) => issue.id === selectedIssueId) ?? null,
        [issues, selectedIssueId],
    );

    return {
        canWrite: workspace.canWrite,
        issues,
        issuesByStatus: getIssuesByStatus(issues),
        loadIssues,
        members: workspace.members,
        selectedIssue,
        setSelectedIssueId,
    };
}
