'use client';

import type { ReactNode } from 'react';
import type { BridgeConfig, BridgeTargetConfig } from '@/src/entities/team/types';
import { useExternalBridgeSettings } from '../model/useExternalBridgeSettings';

const TARGETS: Array<{ key: keyof BridgeConfig; label: string; description: string; placeholder: string }> = [
    {
        key: 'slack',
        label: 'Slack Relay Worker',
        description: '공지와 GitHub 카드 메시지를 Slack incoming webhook으로 비동기 relay합니다.',
        placeholder: 'https://hooks.slack.com/services/...',
    },
    {
        key: 'discord',
        label: 'Discord Relay Worker',
        description: '공지와 GitHub 카드 메시지를 Discord webhook으로 비동기 relay합니다.',
        placeholder: 'https://discord.com/api/webhooks/...',
    },
];

interface Props {
    teamId: string;
}

export function ExternalBridgeSettingsPanel({ teamId }: Props) {
    const settings = useExternalBridgeSettings(teamId);
    const isReadonly = !settings.canManageBridge;

    if (settings.loading) {
        return <div className="rounded-[28px] border border-border-primary bg-bg-secondary p-6 text-sm text-text-secondary">브리지 설정 불러오는 중...</div>;
    }

    return (
        <section className="rounded-[28px] border border-border-primary bg-bg-secondary p-5 sm:p-6">
            <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Bridge Workers</p>
                <h2 className="mt-3 text-2xl font-bold text-white">Slack과 Discord로 공지와 GitHub 흐름을 이어 붙임</h2>
                <p className="mt-3 text-sm leading-7 text-text-secondary">설정 저장 후 worker가 outbox를 비동기로 처리해서 외부 채널까지 안전하게 relay합니다.</p>
                {isReadonly ? <p className="mt-3 text-sm text-amber-300">현재 역할은 {settings.viewerRole ?? 'viewer'}이며 owner/admin만 브리지 설정을 변경할 수 있습니다.</p> : null}
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {TARGETS.map((target) => (
                    <BridgeTargetCard
                        key={target.key}
                        description={target.description}
                        label={target.label}
                        placeholder={target.placeholder}
                        value={settings.form[target.key]}
                        disabled={isReadonly}
                        onChange={(key, value) => settings.updateTargetField(target.key, key, value)}
                    />
                ))}
            </div>

            {settings.error ? <p className="mt-4 text-sm text-red-400">{settings.error}</p> : null}
            {settings.saved ? <p className="mt-4 text-sm text-brand-300">브리지 설정 저장 완료됨</p> : null}
            <button type="button" onClick={settings.save} disabled={settings.saving || isReadonly} className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand-500 font-medium text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50">
                {settings.saving ? '저장 중...' : '브리지 설정 저장'}
            </button>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white">최근 relay 이력</h3>
                        <p className="mt-1 text-sm text-text-secondary">최근 브리지 worker가 처리한 공지와 GitHub 전달 결과를 바로 확인할 수 있습니다.</p>
                    </div>
                    {settings.jobsLoading ? <span className="text-xs uppercase tracking-[0.22em] text-text-tertiary">loading</span> : null}
                </div>

                {isReadonly ? <p className="mt-4 text-sm text-text-secondary">relay 이력은 owner/admin만 볼 수 있습니다.</p> : null}
                {!isReadonly && !settings.jobsLoading && settings.jobs.length === 0 ? <p className="mt-4 text-sm text-text-secondary">아직 relay 이력이 없습니다. 공지 작성이나 GitHub webhook 수신 후 여기에 성공/실패가 쌓입니다.</p> : null}
                {!isReadonly && settings.jobs.length > 0 ? (
                    <div className="mt-4 space-y-3">
                        <p className="text-xs text-text-tertiary">실패한 relay는 현재 브리지 설정으로 새 job을 만들어 다시 시도합니다.</p>
                        {settings.jobs.map((job) => (
                            <article key={job.id} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge tone={job.platform === 'slack' ? 'slack' : 'discord'}>{job.platform}</Badge>
                                    <Badge tone={job.status}>{job.status}</Badge>
                                    <Badge tone="event">{job.eventType}</Badge>
                                </div>
                                <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-white">{job.title}</p>
                                        <p className="mt-1 text-xs text-text-tertiary">시도 {job.attemptCount}회 · 업데이트 {formatTimestamp(job.updatedAt)}</p>
                                        {job.lastError ? <p className="mt-2 text-sm text-red-300">{job.lastError}</p> : null}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {job.status === 'failed' ? (
                                            <button
                                                type="button"
                                                onClick={() => settings.retryJob(job.id)}
                                                disabled={settings.retryingJobId === job.id}
                                                className="rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-2 text-xs text-brand-100 transition hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {settings.retryingJobId === job.id ? '재시도 요청 중...' : '다시 시도'}
                                            </button>
                                        ) : null}
                                        {job.url ? <a href={job.url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/6">원본 열기</a> : null}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}
            </div>
        </section>
    );
}

interface CardProps {
    description: string;
    disabled?: boolean;
    label: string;
    placeholder: string;
    value: BridgeTargetConfig;
    onChange: <K extends keyof BridgeTargetConfig>(key: K, value: BridgeTargetConfig[K]) => void;
}

function BridgeTargetCard({ description, disabled = false, label, placeholder, value, onChange }: CardProps) {
    return (
        <article className={`rounded-[24px] border border-white/8 bg-black/20 p-4 ${disabled ? 'opacity-75' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-white">{label}</h3>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
                </div>
                <label className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-white">
                    <input
                        type="checkbox"
                        checked={value.enabled}
                        disabled={disabled}
                        onChange={(event) => onChange('enabled', event.target.checked)}
                    />
                    활성화
                </label>
            </div>

            <label className="mt-4 block space-y-2">
                <span className="text-xs text-text-tertiary">Webhook URL</span>
                <input
                    value={value.webhookUrl}
                    disabled={disabled}
                    onChange={(event) => onChange('webhookUrl', event.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 text-sm text-white outline-none transition focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </label>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ToggleChip
                    checked={value.relayAnnouncements}
                    disabled={disabled}
                    label="공지 relay"
                    onChange={(next) => onChange('relayAnnouncements', next)}
                />
                <ToggleChip
                    checked={value.relayGithub}
                    disabled={disabled}
                    label="GitHub relay"
                    onChange={(next) => onChange('relayGithub', next)}
                />
            </div>
        </article>
    );
}

function ToggleChip({ checked, disabled = false, label, onChange }: { checked: boolean; disabled?: boolean; label: string; onChange: (value: boolean) => void }) {
    return (
        <label className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm transition ${checked ? 'border-brand-400/40 bg-brand-500/10 text-white' : 'border-border-primary text-text-secondary'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
            {label}
        </label>
    );
}

function Badge({ children, tone }: { children: ReactNode; tone: 'discord' | 'event' | 'failed' | 'pending' | 'processing' | 'sent' | 'slack' }) {
    const toneClass =
        tone === 'slack' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' :
        tone === 'discord' ? 'border-sky-400/30 bg-sky-500/10 text-sky-200' :
        tone === 'sent' ? 'border-brand-400/30 bg-brand-500/10 text-brand-100' :
        tone === 'failed' ? 'border-red-400/30 bg-red-500/10 text-red-200' :
        tone === 'processing' ? 'border-amber-400/30 bg-amber-500/10 text-amber-200' :
        tone === 'pending' ? 'border-white/10 bg-white/6 text-text-secondary' :
        'border-white/10 bg-white/6 text-white';

    return <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${toneClass}`}>{children}</span>;
}

function formatTimestamp(value: string) {
    return new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}
