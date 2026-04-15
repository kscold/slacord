import type { Channel } from '@/src/entities/channel/types';

interface Props {
    canManageGithub: boolean;
    channels: Channel[];
    error: string;
    form: { repoUrl: string; webhookSecret: string; notifyChannelId: string };
    hasStoredSecret: boolean;
    onGenerateSecret: () => void;
    onSave: () => void;
    onUpdateField: (key: 'repoUrl' | 'webhookSecret' | 'notifyChannelId', value: string) => void;
    saved: boolean;
    saving: boolean;
    viewerRole: 'owner' | 'admin' | 'member' | 'guest' | null;
}

export function GitHubSettingsForm({ canManageGithub, channels, error, form, hasStoredSecret, onGenerateSecret, onSave, onUpdateField, saved, saving, viewerRole }: Props) {
    const readOnly = !canManageGithub;

    return (
        <div className="rounded-[28px] border border-border-primary bg-bg-secondary p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white sm:text-xl">GitHub Webhook 연동</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">PR, 리뷰, CI 이벤트를 팀 채널에 실시간으로 흘려보냄.</p>
            {readOnly ? <p className="mt-3 text-sm text-amber-300">현재 역할은 {viewerRole ?? 'viewer'}이며 owner/admin만 GitHub 설정과 secret을 볼 수 있습니다.</p> : null}
            <div className="mt-6 space-y-4">
                <label className="block space-y-2">
                    <span className="text-xs text-text-tertiary">저장소 주소</span>
                    <input value={form.repoUrl} disabled={readOnly} onChange={(e) => onUpdateField('repoUrl', e.target.value)} placeholder="https://github.com/org/repo" className="w-full rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 text-sm text-white outline-none transition focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60" />
                </label>
                <label className="block space-y-2">
                    <span className="text-xs text-text-tertiary">알림 채널</span>
                    <select value={form.notifyChannelId} disabled={readOnly} onChange={(e) => onUpdateField('notifyChannelId', e.target.value)} className="w-full rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 text-sm text-white outline-none transition focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60">
                        {!channels.length ? <option value="">사용 가능한 채널 없음</option> : null}
                        {channels.map((channel) => (
                            <option key={channel.id} value={channel.id}>{channel.name}</option>
                        ))}
                    </select>
                </label>
                <label className="block space-y-2">
                    <span className="text-xs text-text-tertiary">Webhook Secret</span>
                    <div className="grid gap-2 sm:grid-cols-[1fr,auto]">
                        <input value={form.webhookSecret} disabled={readOnly} onChange={(e) => onUpdateField('webhookSecret', e.target.value)} placeholder={readOnly ? (hasStoredSecret ? '설정된 secret은 숨김 처리됨' : '설정된 secret 없음') : '최소 8자'} className="w-full rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60" />
                        <button type="button" disabled={readOnly} onClick={onGenerateSecret} className="min-h-12 rounded-2xl border border-border-primary px-4 text-sm text-text-secondary transition hover:bg-bg-hover hover:text-white disabled:cursor-not-allowed disabled:opacity-50">자동 생성</button>
                    </div>
                    {readOnly && hasStoredSecret ? <p className="text-xs text-text-tertiary">보안상 저장된 secret 값은 owner/admin에게만 표시됩니다.</p> : null}
                </label>
            </div>
            {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
            {saved ? <p className="mt-4 text-sm text-brand-300">저장 완료됨</p> : null}
            <button type="button" onClick={onSave} disabled={saving || !channels.length || readOnly} className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand-500 font-medium text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? '저장 중...' : 'GitHub 설정 저장'}
            </button>
        </div>
    );
}
