import type { TeamInviteLink } from '@/src/entities/team/types';

interface Props {
    inviteUrl: string;
    invites: TeamInviteLink[];
    onRevoke: (code: string) => Promise<void>;
}

export function InviteLinkList({ inviteUrl, invites, onRevoke }: Props) {
    return (
        <div className="space-y-3">
            {invites.map((invite) => (
                <article key={invite.code} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{invite.label || `Invite ${invite.code.slice(0, 6)}`}</p>
                        <span className={`rounded-full px-2 py-1 text-[11px] ${invite.active ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/8 text-text-tertiary'}`}>{invite.active ? '활성' : '비활성'}</span>
                        <span className="rounded-full bg-white/8 px-2 py-1 text-[11px] text-brand-100">{invite.defaultRole}</span>
                    </div>
                    <p className="mt-2 break-all text-xs leading-6 text-text-secondary">{inviteUrl.replace(/\/invite\/[^/]+$/, `/invite/${invite.code}`)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                        <span>사용 {invite.useCount}{invite.maxUses ? ` / ${invite.maxUses}` : ''}</span>
                        <span>{invite.expiresAt ? `만료 ${new Date(invite.expiresAt).toLocaleDateString()}` : '만료 없음'}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button onClick={() => navigator.clipboard.writeText(inviteUrl.replace(/\/invite\/[^/]+$/, `/invite/${invite.code}`))} className="rounded-full border border-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/6">
                            링크 복사
                        </button>
                        <button onClick={() => onRevoke(invite.code)} disabled={!invite.active} className="rounded-full border border-red-400/20 px-3 py-2 text-sm text-red-200 transition hover:bg-red-400/10 disabled:opacity-40">
                            비활성화
                        </button>
                    </div>
                </article>
            ))}
        </div>
    );
}
