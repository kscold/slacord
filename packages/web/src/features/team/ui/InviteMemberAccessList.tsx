import type { TeamMemberSummary } from '@/src/entities/team/types';

interface Props {
    currentUserId: string;
    members: TeamMemberSummary[];
    onUpdate: (memberId: string, data: { role?: 'admin' | 'member'; canManageInvites?: boolean }) => Promise<void>;
}

export function InviteMemberAccessList({ currentUserId, members, onUpdate }: Props) {
    return (
        <div className="space-y-3">
            {members.map((member) => {
                const disabled = member.role === 'owner' || member.userId === currentUserId;
                return (
                    <article key={member.userId} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-white">{member.user?.username || member.userId}</p>
                            <span className="rounded-full bg-white/8 px-2 py-1 text-[11px] text-brand-100">{member.role}</span>
                            {member.canManageInvites ? <span className="rounded-full bg-brand-500/15 px-2 py-1 text-[11px] text-brand-100">invite manager</span> : null}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <select disabled={disabled} value={member.role === 'owner' ? 'owner' : member.role} onChange={(event) => onUpdate(member.userId, { role: event.target.value as 'admin' | 'member' })} className="rounded-full border border-white/10 bg-bg-tertiary px-3 py-2 text-sm text-white disabled:opacity-40">
                                <option value="owner">owner</option>
                                <option value="admin">admin</option>
                                <option value="member">member</option>
                            </select>
                            <button disabled={disabled} onClick={() => onUpdate(member.userId, { canManageInvites: !member.canManageInvites })} className="rounded-full border border-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/6 disabled:opacity-40">
                                {member.canManageInvites ? '초대 위임 해제' : '초대 위임'}
                            </button>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
