import type { Channel } from '@/src/entities/channel/types';

interface Props {
    channels: Channel[];
    error: string;
    form: { repoUrl: string; webhookSecret: string; notifyChannelId: string };
    onGenerateSecret: () => void;
    onSave: () => void;
    onUpdateField: (key: 'repoUrl' | 'webhookSecret' | 'notifyChannelId', value: string) => void;
    saved: boolean;
    saving: boolean;
}

export function GitHubSettingsForm({ channels, error, form, onGenerateSecret, onSave, onUpdateField, saved, saving }: Props) {
    return (
        <div className="rounded-[28px] border border-border-primary bg-bg-secondary p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white sm:text-xl">GitHub Webhook 연동</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">PR, 리뷰, CI 이벤트를 팀 채널에 실시간으로 흘려보냄.</p>
            <div className="mt-6 space-y-4">
                <label className="block space-y-2">
                    <span className="text-xs text-text-tertiary">저장소 주소</span>
                    <input value={form.repoUrl} onChange={(e) => onUpdateField('repoUrl', e.target.value)} placeholder="https://github.com/org/repo" className="w-full rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 text-sm text-white outline-none transition focus:border-brand-400" />
                </label>
                <label className="block space-y-2">
                    <span className="text-xs text-text-tertiary">알림 채널</span>
                    <select value={form.notifyChannelId} onChange={(e) => onUpdateField('notifyChannelId', e.target.value)} className="w-full rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 text-sm text-white outline-none transition focus:border-brand-400">
                        {!channels.length ? <option value="">사용 가능한 채널 없음</option> : null}
                        {channels.map((channel) => (
                            <option key={channel.id} value={channel.id}>{channel.name}</option>
                        ))}
                    </select>
                </label>
                <label className="block space-y-2">
                    <span className="text-xs text-text-tertiary">Webhook Secret</span>
                    <div className="grid gap-2 sm:grid-cols-[1fr,auto]">
                        <input value={form.webhookSecret} onChange={(e) => onUpdateField('webhookSecret', e.target.value)} placeholder="최소 8자" className="w-full rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-brand-400" />
                        <button type="button" onClick={onGenerateSecret} className="min-h-12 rounded-2xl border border-border-primary px-4 text-sm text-text-secondary transition hover:bg-bg-hover hover:text-white">자동 생성</button>
                    </div>
                </label>
            </div>
            {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
            {saved ? <p className="mt-4 text-sm text-brand-300">저장 완료됨</p> : null}
            <button type="button" onClick={onSave} disabled={saving || !channels.length} className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand-500 font-medium text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? '저장 중...' : 'GitHub 설정 저장'}
            </button>
        </div>
    );
}
