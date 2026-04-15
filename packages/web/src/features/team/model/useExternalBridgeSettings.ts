'use client';

import { useEffect, useState } from 'react';
import { authApi, teamApi } from '@/lib/api-client';
import { resolveCurrentTeamMember } from '@/src/entities/team/lib/access';
import type { BridgeConfig, BridgeJobSummary, BridgeTargetConfig, TeamMemberSummary, TeamSummary } from '@/src/entities/team/types';

function createDefaultTargetConfig(): BridgeTargetConfig {
    return {
        enabled: false,
        webhookUrl: '',
        relayAnnouncements: false,
        relayGithub: false,
    };
}

function createDefaultBridgeConfig(): BridgeConfig {
    return {
        slack: createDefaultTargetConfig(),
        discord: createDefaultTargetConfig(),
    };
}

export function useExternalBridgeSettings(teamId: string) {
    const [form, setForm] = useState<BridgeConfig>(createDefaultBridgeConfig());
    const [jobs, setJobs] = useState<BridgeJobSummary[]>([]);
    const [canManageBridge, setCanManageBridge] = useState(false);
    const [viewerRole, setViewerRole] = useState<TeamMemberSummary['role'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setJobsLoading(true);
            setError('');
            try {
                const [meRes, membersRes, teamRes] = await Promise.all([authApi.getMe(), teamApi.getMembers(teamId), teamApi.getTeam(teamId)]);
                if (!active) return;
                const currentUserId = (meRes.data as { id: string } | undefined)?.id ?? '';
                const members = (membersRes.data ?? []) as TeamMemberSummary[];
                const me = resolveCurrentTeamMember(members, currentUserId);
                const allowed = me?.role === 'owner' || me?.role === 'admin';
                const nextTeam = (teamRes.data ?? null) as TeamSummary | null;
                setCanManageBridge(allowed);
                setViewerRole(me?.role ?? null);
                setForm(nextTeam?.bridgeConfig ?? createDefaultBridgeConfig());

                if (!allowed) {
                    setJobs([]);
                    setJobsLoading(false);
                    return;
                }

                const jobsRes = await teamApi.getBridgeJobs(teamId);
                if (!active) return;
                setJobs((jobsRes.data ?? []) as BridgeJobSummary[]);
            } catch (err: any) {
                if (!active) return;
                setError(err.message || '외부 브리지 설정을 불러오지 못했습니다.');
            } finally {
                if (!active) return;
                setLoading(false);
                setJobsLoading(false);
            }
        };

        void load();

        return () => {
            active = false;
        };
    }, [teamId]);

    const updateTargetField = <K extends keyof BridgeTargetConfig>(
        target: keyof BridgeConfig,
        key: K,
        value: BridgeTargetConfig[K],
    ) => {
        setForm((current) => ({
            ...current,
            [target]: {
                ...current[target],
                [key]: value,
            },
        }));
    };

    const save = async () => {
        if (!canManageBridge) {
            setError('owner/admin만 외부 브리지 설정을 변경할 수 있습니다.');
            return;
        }
        setSaving(true);
        setSaved(false);
        setError('');
        try {
            const response = await teamApi.updateBridgeConfig(teamId, form);
            const nextTeam = (response.data ?? null) as TeamSummary | null;
            setForm(nextTeam?.bridgeConfig ?? form);
            const jobsRes = await teamApi.getBridgeJobs(teamId);
            setJobs((jobsRes.data ?? []) as BridgeJobSummary[]);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err: any) {
            setError(err.message ?? '브리지 설정 저장 실패');
        } finally {
            setSaving(false);
        }
    };

    return { canManageBridge, error, form, jobs, jobsLoading, loading, save, saved, saving, updateTargetField, viewerRole };
}
