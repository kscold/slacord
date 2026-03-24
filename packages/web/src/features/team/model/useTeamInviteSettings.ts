'use client';

import { useEffect, useMemo, useState } from 'react';
import { authApi, teamApi } from '@/lib/api-client';
import { publicAppUrl } from '@/lib/runtime-config';
import type { TeamInviteLink, TeamMemberSummary } from '@/src/entities/team/types';

const EMPTY_FORM = { label: '', defaultRole: 'member' as const, maxUses: '', expiresInDays: '7' };

export function useTeamInviteSettings(teamId: string) {
    const [members, setMembers] = useState<TeamMemberSummary[]>([]);
    const [invites, setInvites] = useState<TeamInviteLink[]>([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [currentUserId, setCurrentUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        const [meRes, memberRes] = await Promise.all([authApi.getMe(), teamApi.getMembers(teamId)]);
        const nextUserId = (meRes.data as { id: string } | undefined)?.id ?? '';
        const nextMembers = (memberRes.data ?? []) as TeamMemberSummary[];
        const me = nextMembers.find((member) => member.userId === nextUserId) ?? null;
        const allowed = !!me && (me.role === 'owner' || me.role === 'admin' || me.canManageInvites);

        setError('');
        setCurrentUserId(nextUserId);
        setMembers(nextMembers);
        if (!allowed) return void setInvites([]);

        const inviteRes = await teamApi.getInviteLinks(teamId);
        setInvites((inviteRes.data ?? []) as TeamInviteLink[]);
    };

    useEffect(() => {
        let active = true;
        setLoading(true);
        load().catch((err: Error) => active && setError(err.message || '초대 정보를 불러오지 못했습니다.')).finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [teamId]);

    const me = useMemo(() => members.find((member) => member.userId === currentUserId) ?? null, [currentUserId, members]);
    const canManageInvites = !!me && (me.role === 'owner' || me.role === 'admin' || me.canManageInvites);
    const canManageMembers = me?.role === 'owner';
    const activeInvite = invites.find((invite) => invite.active) ?? invites[0] ?? null;
    const inviteUrl = activeInvite ? `${publicAppUrl()}/invite/${activeInvite.code}` : '';

    const updateField = (key: keyof typeof EMPTY_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }));

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

    const updateMemberAccess = async (memberId: string, data: { role?: 'admin' | 'member'; canManageInvites?: boolean }) => {
        setError('');
        try {
            await teamApi.updateMemberAccess(teamId, memberId, data);
            await load();
        } catch (err: any) {
            setError(err.message ?? '멤버 초대 권한 변경 실패');
        }
    };

    return { activeInvite, canManageInvites, canManageMembers, creating, currentUserId, error, form, inviteUrl, invites, loading, members, createInvite, revokeInvite, updateField, updateMemberAccess };
}
