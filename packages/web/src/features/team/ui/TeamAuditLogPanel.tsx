'use client';

import { useMemo } from 'react';
import type { TeamAuditLogSummary } from '@/src/entities/team/types';
import { useTeamAuditLog } from '../model/useTeamAuditLog';

const CATEGORY_FILTERS = [
    { key: 'all', label: '전체' },
    { key: 'delivery', label: '전달' },
    { key: 'access', label: '접근' },
    { key: 'bridge', label: '브리지' },
] as const;

interface Props {
    active?: boolean;
    teamId: string;
}

export function TeamAuditLogPanel({ active = true, teamId }: Props) {
    const auditLog = useTeamAuditLog(teamId, { active });
    const memberMap = useMemo(
        () =>
            new Map(
                auditLog.members.map((member) => [
                    member.userId,
                    member.user?.username ?? member.user?.email ?? member.userId,
                ]),
            ),
        [auditLog.members],
    );

    return (
        <section className="rounded-[28px] border border-border-primary bg-bg-secondary p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Operations</p>
                    <h2 className="mt-3 text-2xl font-bold text-white">운영 감사 로그와 재시도 흐름을 남김</h2>
                    <p className="mt-3 text-sm leading-7 text-text-secondary">
                        GitHub, 브리지, 초대, 멤버 접근 권한 변경과 같은 운영 액션이 시간순으로 쌓입니다.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void auditLog.refresh()}
                    disabled={!auditLog.canViewAuditLog || auditLog.loading}
                    className="rounded-full border border-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {auditLog.loading ? '새로고침 중...' : '새로고침'}
                </button>
            </div>

            {!auditLog.canViewAuditLog ? (
                <p className="mt-5 text-sm text-text-secondary">
                    운영 감사 로그는 owner/admin만 볼 수 있습니다. 현재 역할은 {auditLog.viewerRole ?? 'viewer'}입니다.
                </p>
            ) : null}

            {auditLog.canViewAuditLog ? (
                <div className="mt-5 flex flex-wrap gap-2">
                    {CATEGORY_FILTERS.map((filter) => (
                        <button
                            key={filter.key}
                            type="button"
                            onClick={() => auditLog.setCategoryFilter(filter.key)}
                            className={`rounded-full border px-3 py-2 text-xs transition ${
                                auditLog.categoryFilter === filter.key
                                    ? 'border-brand-400/40 bg-brand-500/12 text-white'
                                    : 'border-white/10 bg-white/4 text-text-secondary hover:bg-white/8'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            ) : null}

            {auditLog.error ? <p className="mt-4 text-sm text-red-400">{auditLog.error}</p> : null}
            {auditLog.canViewAuditLog && !auditLog.loading && auditLog.logs.length === 0 ? (
                <p className="mt-4 text-sm text-text-secondary">아직 운영 감사 로그가 없습니다.</p>
            ) : null}
            {auditLog.canViewAuditLog && auditLog.loading ? (
                <div className="mt-4 rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm text-text-secondary">
                    운영 감사 로그를 불러오는 중...
                </div>
            ) : null}

            {auditLog.canViewAuditLog && auditLog.logs.length > 0 ? (
                <div className="mt-4 space-y-3">
                    {auditLog.logs.map((entry) => (
                        <AuditLogEntryCard key={entry.id} entry={entry} memberMap={memberMap} />
                    ))}
                </div>
            ) : null}
        </section>
    );
}

const CATEGORY_LABELS = {
    access: 'Access',
    bridge: 'Bridge',
    delivery: 'Delivery',
} as const;

function Badge({ children }: { children: string }) {
    return (
        <span className="rounded-full border border-brand-400/20 bg-brand-500/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-brand-100">
            {children}
        </span>
    );
}

function AuditLogEntryCard({
    entry,
    memberMap,
}: {
    entry: TeamAuditLogSummary;
    memberMap: Map<string, string>;
}) {
    const metadataLabel = formatMetadata(entry, memberMap);

    return (
        <article className="rounded-[24px] border border-white/8 bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <Badge>{CATEGORY_LABELS[entry.category]}</Badge>
                <p className="text-xs text-text-tertiary">
                    {resolveActorName(entry, memberMap)} · {formatTimestamp(entry.createdAt)}
                </p>
            </div>
            <p className="mt-3 text-sm font-semibold text-white">{entry.summary}</p>
            {entry.target ? (
                <p className="mt-2 text-sm text-text-secondary">
                    대상: <span className="text-white">{resolveTarget(entry, memberMap)}</span>
                </p>
            ) : null}
            {metadataLabel ? <p className="mt-2 text-sm text-text-secondary">{metadataLabel}</p> : null}
        </article>
    );
}

function resolveActorName(entry: TeamAuditLogSummary, memberMap: Map<string, string>) {
    return memberMap.get(entry.actorId) ?? entry.actorId;
}

function resolveTarget(entry: TeamAuditLogSummary, memberMap: Map<string, string>) {
    if (!entry.target) return '';
    if (entry.action === 'member_access_updated') {
        return memberMap.get(entry.target) ?? entry.target;
    }
    return entry.target;
}

function formatMetadata(entry: TeamAuditLogSummary, memberMap: Map<string, string>) {
    if (entry.action === 'github_config_updated') {
        return entry.metadata.notifyChannelId ? `알림 채널: ${entry.metadata.notifyChannelId}` : '';
    }

    if (entry.action === 'bridge_config_updated') {
        const enabled: string[] = [];
        if (entry.metadata.slackEnabled) enabled.push('Slack');
        if (entry.metadata.discordEnabled) enabled.push('Discord');
        return enabled.length > 0 ? `활성 플랫폼: ${enabled.join(', ')}` : '모든 브리지 relay를 비활성화함';
    }

    if (
        entry.action === 'invite_link_created' ||
        entry.action === 'invite_link_revoked' ||
        entry.action === 'invite_link_deleted'
    ) {
        return entry.metadata.defaultRole ? `기본 역할: ${entry.metadata.defaultRole}` : '';
    }

    if (entry.action === 'member_access_updated') {
        const memberLabel = entry.target ? (memberMap.get(entry.target) ?? entry.target) : '멤버';
        return `변경 대상: ${memberLabel} · 역할: ${entry.metadata.role ?? '-'}`;
    }

    if (entry.action === 'bridge_job_retried') {
        return `${entry.metadata.platform ?? '-'} · ${entry.metadata.eventType ?? '-'}`;
    }

    return '';
}

function formatTimestamp(value: string) {
    return new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}
