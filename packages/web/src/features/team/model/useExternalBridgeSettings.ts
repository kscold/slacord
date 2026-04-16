'use client';

import { useEffect, useRef, useState } from 'react';
import { teamApi } from '@/lib/api-client';
import type {
    BridgeConfig,
    BridgeJobPlatform,
    BridgeJobStatus,
    BridgeJobSummary,
    PublicBridgeConfig,
    BridgeTargetConfig,
    TeamSettingsSummary,
    TeamSummary,
} from '@/src/entities/team/types';
import { useTeamWorkspaceData } from './useTeamWorkspaceData';

type JobStatusFilter = 'all' | BridgeJobStatus;
type JobPlatformFilter = 'all' | BridgeJobPlatform;

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

function toEditableBridgeConfig(config: PublicBridgeConfig | null | undefined): BridgeConfig {
    if (!config) return createDefaultBridgeConfig();
    return {
        slack: {
            enabled: config.slack.enabled,
            webhookUrl: '',
            relayAnnouncements: config.slack.relayAnnouncements,
            relayGithub: config.slack.relayGithub,
        },
        discord: {
            enabled: config.discord.enabled,
            webhookUrl: '',
            relayAnnouncements: config.discord.relayAnnouncements,
            relayGithub: config.discord.relayGithub,
        },
    };
}

export function useExternalBridgeSettings(teamId: string) {
    const [form, setForm] = useState<BridgeConfig>(createDefaultBridgeConfig());
    const [jobs, setJobs] = useState<BridgeJobSummary[]>([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('all');
    const [platformFilter, setPlatformFilter] = useState<JobPlatformFilter>('all');
    const mountedRef = useRef(true);
    const retryRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const syncKeyRef = useRef('');
    const workspace = useTeamWorkspaceData(teamId, { includeSettings: true });
    const canManageBridge = workspace.currentMember?.role === 'owner' || workspace.currentMember?.role === 'admin';
    const viewerRole = workspace.currentMember?.role ?? null;
    const loading = workspace.isInitialLoading || (canManageBridge && workspace.isInitialSettingsLoading);
    const error = saveError || workspace.error || (canManageBridge ? workspace.settingsError : '');

    const fetchJobs = async (
        filters: { status: JobStatusFilter; platform: JobPlatformFilter } = {
            status: statusFilter,
            platform: platformFilter,
        },
    ) => {
        const jobsRes = await teamApi.getBridgeJobs(teamId, {
            limit: 12,
            status: filters.status === 'all' ? undefined : filters.status,
            platform: filters.platform === 'all' ? undefined : filters.platform,
        });
        return (jobsRes.data ?? []) as BridgeJobSummary[];
    };

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (retryRefreshTimerRef.current) {
                clearTimeout(retryRefreshTimerRef.current);
                retryRefreshTimerRef.current = null;
            }
            if (savedTimerRef.current) {
                clearTimeout(savedTimerRef.current);
                savedTimerRef.current = null;
            }
        };
    }, []);

    const announceSaved = () => {
        setSaved(true);
        if (savedTimerRef.current) {
            clearTimeout(savedTimerRef.current);
        }
        savedTimerRef.current = setTimeout(() => setSaved(false), 4000);
    };

    useEffect(() => {
        const publicConfig = (workspace.team as TeamSummary | null)?.bridgeConfig;
        const settingsConfig = (workspace.settings as TeamSettingsSummary | null)?.bridgeConfig;
        const nextForm = canManageBridge
            ? (settingsConfig ?? createDefaultBridgeConfig())
            : toEditableBridgeConfig((publicConfig as PublicBridgeConfig | null | undefined) ?? null);
        const nextSyncKey = JSON.stringify(nextForm);
        if (syncKeyRef.current !== nextSyncKey) {
            syncKeyRef.current = nextSyncKey;
            setForm(nextForm);
        }
        if (!canManageBridge) {
            setJobs([]);
            setJobsLoading(false);
        }
    }, [canManageBridge, workspace.settings, workspace.team]);

    useEffect(() => {
        if (!canManageBridge) return;
        let active = true;

        const loadJobs = async () => {
            setJobsLoading(true);
            try {
                const nextJobs = await fetchJobs();
                if (!active) return;
                setJobs(nextJobs);
            } catch (err: any) {
                if (!active) return;
                setSaveError(err.message || '브리지 relay 이력을 불러오지 못했습니다.');
            } finally {
                if (!active) return;
                setJobsLoading(false);
            }
        };

        void loadJobs();

        return () => {
            active = false;
        };
    }, [canManageBridge, platformFilter, statusFilter, teamId]);

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
            setSaveError('owner/admin만 외부 브리지 설정을 변경할 수 있습니다.');
            return;
        }
        setSaving(true);
        setSaved(false);
        setSaveError('');
        try {
            const response = await teamApi.updateBridgeConfig(teamId, form);
            const nextTeam = (response.data ?? null) as TeamSettingsSummary | null;
            const nextForm = nextTeam?.bridgeConfig ?? form;
            syncKeyRef.current = JSON.stringify(nextForm);
            setForm(nextForm);
            announceSaved();
            const refreshResults = await Promise.allSettled([
                workspace.refreshBase(),
                workspace.refreshSettings(),
                fetchJobs(),
            ]);
            const jobsResult = refreshResults[2];
            if (jobsResult?.status === 'fulfilled') {
                setJobs(jobsResult.value);
            }
        } catch (err: any) {
            setSaveError(err.message ?? '브리지 설정 저장 실패');
        } finally {
            setSaving(false);
        }
    };

    const retryJob = async (jobId: string) => {
        if (!canManageBridge) {
            setSaveError('owner/admin만 실패한 브리지 relay를 다시 시도할 수 있습니다.');
            return;
        }

        setRetryingJobId(jobId);
        setSaveError('');
        try {
            await teamApi.retryBridgeJob(teamId, jobId);
            setJobs(await fetchJobs());
            if (retryRefreshTimerRef.current) clearTimeout(retryRefreshTimerRef.current);
            retryRefreshTimerRef.current = setTimeout(() => {
                void fetchJobs()
                    .then((nextJobs) => {
                        if (mountedRef.current) setJobs(nextJobs);
                    })
                    .catch(() => {});
            }, 1800);
        } catch (err: any) {
            setSaveError(err.message ?? '브리지 relay 재시도 실패');
        } finally {
            setRetryingJobId(null);
        }
    };

    return {
        canManageBridge,
        error,
        form,
        jobs,
        jobsLoading,
        loading,
        platformFilter,
        retryJob,
        retryingJobId,
        save,
        saved,
        saving,
        setPlatformFilter,
        setStatusFilter,
        statusFilter,
        updateTargetField,
        viewerRole,
    };
}
