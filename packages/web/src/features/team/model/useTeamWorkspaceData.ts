'use client';

import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { authApi, channelApi, teamApi } from '@/lib/api-client';
import type { Channel } from '@/src/entities/channel/types';
import { hasTeamWriteAccess, resolveCurrentTeamMember } from '@/src/entities/team/lib/access';
import type { TeamMemberSummary, TeamSettingsSummary, TeamSummary } from '@/src/entities/team/types';
import type { User } from '@/src/entities/user/types';

const BASE_TTL_MS = 15_000;
const SETTINGS_TTL_MS = 15_000;

interface TeamWorkspaceEntry {
    channels: Channel[];
    error: string;
    loadedAt: number;
    loading: boolean;
    me: User | null;
    members: TeamMemberSummary[];
    settings: TeamSettingsSummary | null;
    settingsError: string;
    settingsLoadedAt: number;
    settingsLoading: boolean;
    team: TeamSummary | null;
}

interface TeamWorkspaceStore {
    entries: Record<string, TeamWorkspaceEntry>;
    ensureBase: (teamId: string, options?: { force?: boolean }) => Promise<void>;
    ensureSettings: (teamId: string, options?: { force?: boolean }) => Promise<void>;
    patchEntry: (teamId: string, patch: Partial<TeamWorkspaceEntry>) => void;
}

interface UseTeamWorkspaceDataOptions {
    includeSettings?: boolean;
}

const baseRequests = new Map<string, Promise<void>>();
const settingsRequests = new Map<string, Promise<void>>();

function createEmptyEntry(): TeamWorkspaceEntry {
    return {
        channels: [],
        error: '',
        loadedAt: 0,
        loading: false,
        me: null,
        members: [],
        settings: null,
        settingsError: '',
        settingsLoadedAt: 0,
        settingsLoading: false,
        team: null,
    };
}

const useTeamWorkspaceStore = create<TeamWorkspaceStore>((set, get) => ({
    entries: {},
    patchEntry: (teamId, patch) => {
        set((state) => ({
            entries: {
                ...state.entries,
                [teamId]: {
                    ...(state.entries[teamId] ?? createEmptyEntry()),
                    ...patch,
                },
            },
        }));
    },
    ensureBase: async (teamId, options = {}) => {
        const current = get().entries[teamId];
        if (!options.force && current && (current.loading || Date.now() - current.loadedAt < BASE_TTL_MS)) {
            return;
        }

        const existingRequest = baseRequests.get(teamId);
        if (existingRequest) {
            await existingRequest;
            return;
        }

        get().patchEntry(teamId, { error: '', loading: true });

        const request = Promise.all([
            authApi.getMe().catch((error: Error) => error),
            teamApi.getMembers(teamId).catch((error: Error) => error),
            teamApi.getTeam(teamId).catch((error: Error) => error),
            channelApi.getChannels(teamId).catch((error: Error) => error),
        ])
            .then(([meResponse, membersResponse, teamResponse, channelResponse]) => {
                const nextEntry: Partial<TeamWorkspaceEntry> = {
                    channels:
                        isApiSuccess(channelResponse) && Array.isArray(channelResponse.data)
                            ? (channelResponse.data as Channel[])
                            : [],
                    error: collectWorkspaceError([meResponse, membersResponse, teamResponse, channelResponse]),
                    loadedAt: Date.now(),
                    loading: false,
                    me: isApiSuccess(meResponse) && meResponse.data ? (meResponse.data as User) : null,
                    members:
                        isApiSuccess(membersResponse) && Array.isArray(membersResponse.data)
                            ? (membersResponse.data as TeamMemberSummary[])
                            : [],
                    team: isApiSuccess(teamResponse) && teamResponse.data ? (teamResponse.data as TeamSummary) : null,
                };

                get().patchEntry(teamId, nextEntry);
            })
            .catch((error: Error) => {
                get().patchEntry(teamId, {
                    error: error.message || '워크스페이스 정보를 불러오지 못했습니다.',
                    loadedAt: Date.now(),
                    loading: false,
                });
            })
            .finally(() => {
                baseRequests.delete(teamId);
            });

        baseRequests.set(teamId, request);
        await request;
    },
    ensureSettings: async (teamId, options = {}) => {
        const current = get().entries[teamId];
        if (
            !options.force &&
            current &&
            (current.settingsLoading || Date.now() - current.settingsLoadedAt < SETTINGS_TTL_MS)
        ) {
            return;
        }

        const existingRequest = settingsRequests.get(teamId);
        if (existingRequest) {
            await existingRequest;
            return;
        }

        get().patchEntry(teamId, { settingsError: '', settingsLoading: true });

        const request = teamApi
            .getTeamSettings(teamId)
            .then((response) => {
                get().patchEntry(teamId, {
                    settings: response.success && response.data ? (response.data as TeamSettingsSummary) : null,
                    settingsError: '',
                    settingsLoadedAt: Date.now(),
                    settingsLoading: false,
                });
            })
            .catch((error: Error) => {
                get().patchEntry(teamId, {
                    settings: null,
                    settingsError: error.message || '관리자 설정을 불러오지 못했습니다.',
                    settingsLoadedAt: Date.now(),
                    settingsLoading: false,
                });
            })
            .finally(() => {
                settingsRequests.delete(teamId);
            });

        settingsRequests.set(teamId, request);
        await request;
    },
}));

function isApiSuccess<T>(value: T | Error): value is T & { success: true; data?: unknown } {
    return (
        !(value instanceof Error) &&
        typeof value === 'object' &&
        value !== null &&
        'success' in value &&
        value.success === true
    );
}

function collectWorkspaceError(values: Array<unknown>) {
    const firstError = values.find((value) => value instanceof Error) as Error | undefined;
    return firstError?.message ?? '';
}

export function useTeamWorkspaceData(teamId: string, options: UseTeamWorkspaceDataOptions = {}) {
    const emptyEntry = useMemo(createEmptyEntry, []);
    const entry = useTeamWorkspaceStore((state) => state.entries[teamId] ?? emptyEntry);
    const ensureBase = useTeamWorkspaceStore((state) => state.ensureBase);
    const ensureSettings = useTeamWorkspaceStore((state) => state.ensureSettings);

    useEffect(() => {
        void ensureBase(teamId);
    }, [ensureBase, teamId]);

    const currentMember = useMemo(
        () => resolveCurrentTeamMember(entry.members, entry.me?.id ?? ''),
        [entry.me?.id, entry.members],
    );
    const canManageSettings = currentMember?.role === 'owner' || currentMember?.role === 'admin';
    const hasBaseSnapshot =
        Boolean(entry.me) || Boolean(entry.team) || entry.members.length > 0 || entry.channels.length > 0;
    const isInitialLoading = entry.loading && !hasBaseSnapshot;
    const isRefreshing = entry.loading && hasBaseSnapshot;
    const isInitialSettingsLoading = entry.settingsLoading && !entry.settings;
    const isRefreshingSettings = entry.settingsLoading && Boolean(entry.settings);

    useEffect(() => {
        if (!options.includeSettings || !canManageSettings) return;
        void ensureSettings(teamId);
    }, [canManageSettings, ensureSettings, options.includeSettings, teamId]);

    return {
        ...entry,
        canManageSettings,
        canWrite: hasTeamWriteAccess(currentMember?.role),
        currentMember,
        currentUserId: entry.me?.id ?? '',
        currentUsername: entry.me?.username ?? '',
        hasBaseSnapshot,
        isInitialLoading,
        isInitialSettingsLoading,
        isRefreshing,
        isRefreshingSettings,
        refreshBase: () => ensureBase(teamId, { force: true }),
        refreshSettings: () => ensureSettings(teamId, { force: true }),
    };
}
