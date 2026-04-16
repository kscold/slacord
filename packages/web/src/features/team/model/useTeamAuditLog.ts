'use client';

import { useCallback, useEffect, useState } from 'react';
import { teamApi } from '@/lib/api-client';
import type { TeamAuditLogCategory, TeamAuditLogSummary } from '@/src/entities/team/types';
import { useTeamWorkspaceData } from './useTeamWorkspaceData';

type AuditCategoryFilter = 'all' | TeamAuditLogCategory;

interface Options {
    active?: boolean;
}

export function useTeamAuditLog(teamId: string, options: Options = {}) {
    const [categoryFilter, setCategoryFilter] = useState<AuditCategoryFilter>('all');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<TeamAuditLogSummary[]>([]);
    const workspace = useTeamWorkspaceData(teamId, { includeSettings: true });
    const canViewAuditLog = workspace.canManageSettings;
    const viewerRole = workspace.currentMember?.role ?? null;
    const active = options.active ?? true;

    const fetchLogs = useCallback(async () => {
        if (!active) return;
        if (!canViewAuditLog) {
            setLogs([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await teamApi.getTeamAuditLogs(teamId, {
                category: categoryFilter === 'all' ? undefined : categoryFilter,
                limit: 20,
            });
            setLogs((response.data ?? []) as TeamAuditLogSummary[]);
        } catch (err: any) {
            setError(err.message ?? '운영 감사 로그를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, [active, canViewAuditLog, categoryFilter, teamId]);

    useEffect(() => {
        void fetchLogs();
    }, [fetchLogs]);

    return {
        canViewAuditLog,
        categoryFilter,
        error,
        loading,
        logs,
        members: workspace.members,
        refresh: fetchLogs,
        setCategoryFilter,
        viewerRole,
    };
}
