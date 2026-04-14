'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authApi, issueApi, teamApi } from '@/lib/api-client';
import { hasTeamWriteAccess, resolveCurrentTeamMember } from '@/src/entities/team/lib/access';
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
    const [currentUserId, setCurrentUserId] = useState('');
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
        Promise.all([authApi.getMe().catch(() => null), teamApi.getMembers(teamId).catch(() => null)]).then(([meResponse, memberResponse]) => {
            if (meResponse?.success && meResponse.data) {
                setCurrentUserId((meResponse.data as { id: string }).id ?? '');
            }
            if (memberResponse?.success && Array.isArray(memberResponse.data)) {
                setMembers(memberResponse.data as TeamMemberSummary[]);
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
    const currentMember = useMemo(() => resolveCurrentTeamMember(members, currentUserId), [currentUserId, members]);

    return {
        canWrite: hasTeamWriteAccess(currentMember?.role),
        issues,
        issuesByStatus: getIssuesByStatus(issues),
        loadIssues,
        members,
        selectedIssue,
        setSelectedIssueId,
    };
}
