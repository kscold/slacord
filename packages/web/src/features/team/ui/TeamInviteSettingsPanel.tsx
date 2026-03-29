'use client';

import { InviteQrCard } from './InviteQrCard';
import { InviteLinkList } from './InviteLinkList';
import { InviteMemberAccessList } from './InviteMemberAccessList';
import { useTeamInviteSettings } from '../model/useTeamInviteSettings';

interface Props {
    teamId: string;
}

export function TeamInviteSettingsPanel({ teamId }: Props) {
    const settings = useTeamInviteSettings(teamId);

    return (
        <section className="space-y-5 rounded-[28px] border border-border-primary bg-bg-secondary p-5 sm:p-6">
            <div>
                <p className="text-xs uppercase tracking-[0.22em] text-brand-200">Invite Control</p>
                <h2 className="mt-3 text-2xl font-bold text-white">초대 링크, QR, 초대 위임까지 한 번에 관리</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary">owner/admin/invite manager가 디스코드처럼 링크 초대를 만들고, 멤버별 초대 권한도 나눠줄 수 있음.</p>
            </div>
            {settings.loading ? <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm text-text-secondary">초대 설정 불러오는 중...</div> : null}
            {settings.error ? <div className="rounded-[24px] border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{settings.error}</div> : null}
            {!settings.loading ? (
                <>
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <input value={settings.form.label} onChange={(event) => settings.updateField('label', event.target.value)} placeholder="초대 링크 이름" className="rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-white outline-none" />
                                <select value={settings.form.defaultRole} onChange={(event) => settings.updateField('defaultRole', event.target.value)} className="rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-white outline-none">
                                    <option value="member">member 초대</option>
                                    <option value="admin">admin 초대</option>
                                </select>
                                <input value={settings.form.maxUses} onChange={(event) => settings.updateField('maxUses', event.target.value)} type="number" min="1" placeholder="최대 사용 횟수 (선택)" className="rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-white outline-none" />
                                <input value={settings.form.expiresInDays} onChange={(event) => settings.updateField('expiresInDays', event.target.value)} type="number" min="1" max="365" placeholder="만료 일수" className="rounded-2xl border border-border-primary bg-bg-tertiary px-4 py-3 text-white outline-none" />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button disabled={!settings.canManageInvites || settings.creating} onClick={settings.createInvite} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-40">초대 링크 만들기</button>
                                <button disabled={!settings.activeInvite} onClick={() => settings.activeInvite && navigator.clipboard.writeText(settings.inviteUrl)} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/6 disabled:opacity-40">활성 링크 복사</button>
                            </div>
                        </div>
                        <InviteQrCard value={settings.inviteUrl} />
                    </div>
                    <InviteLinkList inviteUrl={settings.inviteUrl} invites={settings.invites} onRevoke={settings.revokeInvite} onDelete={settings.deleteInvite} />
                    {settings.canManageMembers ? <InviteMemberAccessList currentUserId={settings.currentUserId} members={settings.members} onUpdate={settings.updateMemberAccess} /> : null}
                </>
            ) : null}
        </section>
    );
}
