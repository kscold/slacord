'use client';

import { useEffect, useMemo, useState } from 'react';
import { teamApi } from '@/lib/api-client';
import { publicAppUrl } from '@/lib/runtime-config';
import { resolveCurrentTeamMember } from '@/src/entities/team/lib/access';
import type { TeamInviteLink, TeamMemberSummary } from '@/src/entities/team/types';
import { useTeamWorkspaceData } from './useTeamWorkspaceData';

const EMPTY_FORM = { label: '', defaultRole: 'member' as const, maxUses: '', expiresInDays: '7' };

export function useTeamInviteSettings(teamId: string) {
    const [invites, setInvites] = useState<TeamInviteLink[]>([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const workspace = useTeamWorkspaceData(teamId);

    const load = async () => {
        const nextUserId = workspace.currentUserId;
        const nextMembers = workspace.members as TeamMemberSummary[];
        const me = resolveCurrentTeamMember(nextMembers, nextUserId);
        const allowed = !!me && (me.role === 'owner' || me.role === 'admin' || me.canManageInvites);

        setError('');
        if (!allowed) return void setInvites([]);

        const inviteRes = await teamApi.getInviteLinks(teamId);
        setInvites((inviteRes.data ?? []) as TeamInviteLink[]);
    };

    useEffect(() => {
        let active = true;
        setLoading((current) => current || !workspace.hasBaseSnapshot);
        load()
            .catch((err: Error) => active && setError(err.message || '초대 정보를 불러오지 못했습니다.'))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [teamId, workspace.currentUserId, workspace.hasBaseSnapshot, workspace.members]);

    const me = useMemo(
        () => resolveCurrentTeamMember(workspace.members, workspace.currentUserId),
        [workspace.currentUserId, workspace.members],
    );
    const canManageInvites = !!me && (me.role === 'owner' || me.role === 'admin' || me.canManageInvites);
    const canManageMembers = me?.role === 'owner';
    const activeInvite = invites.find((invite) => invite.active) ?? invites[0] ?? null;
    const inviteUrl = activeInvite ? `${publicAppUrl()}/invite/${activeInvite.code}` : '';

    const updateField = (key: keyof typeof EMPTY_FORM, value: string) =>
        setForm((current) => ({ ...current, [key]: value }));

    const createInvite = async () => {
        setCreating(true);
        setError('');
        try {
            await teamApi.createInviteLink(teamId, {
                label: form.label || undefined,
                defaultRole: form.defaultRole,
                expiresInDays: Number(form.expiresInDays) || undefined,
                maxUses: Number(form.maxUses) || undefined,
            });
            setForm(EMPTY_FORM);
            await load();
        } catch (err: any) {
            setError(err.message ?? '초대 링크 생성 실패');
        } finally {
            setCreating(false);
        }
    };

    const revokeInvite = async (code: string) => {
        setError('');
        try {
            await teamApi.revokeInviteLink(teamId, code);
            await load();
        } catch (err: any) {
            setError(err.message ?? '초대 링크 비활성화 실패');
        }
    };

    const deleteInvite = async (code: string) => {
        setError('');
        try {
            await teamApi.deleteInviteLink(teamId, code);
            await load();
        } catch (err: any) {
            setError(err.message ?? '초대 링크 삭제 실패');
        }
    };

    const updateMemberAccess = async (
        memberId: string,
        data: { role?: 'admin' | 'member' | 'guest'; canManageInvites?: boolean },
    ) => {
        setError('');
        try {
            await teamApi.updateMemberAccess(teamId, memberId, data);
            await load();
        } catch (err: any) {
            setError(err.message ?? '멤버 초대 권한 변경 실패');
        }
    };

    return {
        activeInvite,
        canManageInvites,
        canManageMembers,
        creating,
        currentUserId: workspace.currentUserId,
        error,
        form,
        inviteUrl,
        invites,
        loading,
        members: workspace.members,
        createInvite,
        deleteInvite,
        revokeInvite,
        updateField,
        updateMemberAccess,
    };
}
