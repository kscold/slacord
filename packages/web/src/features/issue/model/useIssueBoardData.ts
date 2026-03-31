'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { issueApi, teamApi } from '@/lib/api-client';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import { useIssueStore } from './issue.store';
import { getIssuesByStatus } from './getIssuesByStatus';
import type { IssueStatus } from '@/src/entities/issue/types';

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
    const { issues, setIssues } = useIssueStore();
    const [members, setMembers] = useState<TeamMemberSummary[]>([]);
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

    const loadIssues = useCallback(async () => {
        const response = await issueApi.getIssues(teamId, {
            query: filters.query,
            assigneeId: filters.assigneeId || undefined,
            status: filters.statusFilter === 'all' ? undefined : filters.statusFilter,
        });

        if (response.success && Array.isArray(response.data)) {
            setIssues(response.data);
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
        if (focusIssueId) setSelectedIssueId(focusIssueId);
    }, [searchParams]);

    const selectedIssue = useMemo(
        () => issues.find((issue) => issue.id === selectedIssueId) ?? null,
        [issues, selectedIssueId],
    );

    return {
        issues,
        issuesByStatus: getIssuesByStatus(issues),
        loadIssues,
        members,
        selectedIssue,
        setSelectedIssueId,
    };
}
