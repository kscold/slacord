'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ConfluenceImportPanel } from '@/src/features/document/ui/ConfluenceImportPanel';
import { useTeamWorkspaceData } from '../model/useTeamWorkspaceData';
import { DiscordImportPanel } from './DiscordImportPanel';
import { ExternalBridgeSettingsPanel } from './ExternalBridgeSettingsPanel';
import { GitHubSettingsSection } from './GitHubSettingsSection';
import { TeamAuditLogPanel } from './TeamAuditLogPanel';
import { TeamInviteSettingsPanel } from './TeamInviteSettingsPanel';

const SECTION_ITEMS = [
    {
        key: 'delivery',
        eyebrow: 'Delivery',
        label: '전달과 연동',
        description: 'GitHub webhook과 Slack/Discord relay를 한 군데에 모아 운영 흐름을 먼저 맞춥니다.',
    },
    {
        key: 'access',
        eyebrow: 'Access',
        label: '초대와 권한',
        description: '초대 링크, QR, 멤버별 초대 위임과 역할 조정을 한 묶음으로 관리합니다.',
    },
    {
        key: 'imports',
        eyebrow: 'Imports',
        label: '가져오기와 마이그레이션',
        description: 'Confluence와 Discord에서 문서와 대화 기록을 옮기는 작업을 분리합니다.',
    },
    {
        key: 'operations',
        eyebrow: 'Operations',
        label: '운영 이력',
        description: '설정 변경, 초대 관리, 브리지 재시도 같은 운영 액션을 시간순으로 확인합니다.',
    },
] as const;

type SectionKey = (typeof SECTION_ITEMS)[number]['key'];

function isSectionKey(value: string | null): value is SectionKey {
    return SECTION_ITEMS.some((section) => section.key === value);
}

interface Props {
    teamId: string;
}

export function TeamSettingsShell({ teamId }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const workspace = useTeamWorkspaceData(teamId, { includeSettings: true });
    const activeSection = isSectionKey(searchParams.get('section'))
        ? (searchParams.get('section') as SectionKey)
        : 'delivery';
    const activeSectionMeta = SECTION_ITEMS.find((section) => section.key === activeSection) ?? SECTION_ITEMS[0];
    const visibleChannelCount = workspace.channels.filter((channel) => !['dm', 'group'].includes(channel.type)).length;
    const bridgeEnabledCount = [
        workspace.team?.bridgeConfig.slack.enabled,
        workspace.team?.bridgeConfig.discord.enabled,
    ].filter(Boolean).length;
    const hasGithubIntegration = workspace.canManageSettings
        ? Boolean(workspace.settings?.githubConfig?.repoUrl?.trim())
        : Boolean(workspace.team?.githubConfig?.repoUrl?.trim() || workspace.team?.githubConfig?.hasWebhookSecret);
    const currentRole = workspace.currentMember?.role ?? 'viewer';

    const selectSection = (nextSection: SectionKey) => {
        const nextParams = new URLSearchParams(searchParams.toString());
        if (nextSection === 'delivery') {
            nextParams.delete('section');
        } else {
            nextParams.set('section', nextSection);
        }
        const nextQuery = nextParams.toString();
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
            scroll: false,
        });
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(214,176,138,0.16)_0%,rgba(14,12,10,0.96)_56%,rgba(14,12,10,0.92)_100%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="max-w-3xl">
                        <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Team Settings</p>
                        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                            {workspace.team?.name ?? '워크스페이스'} 운영 설정을 흐름별로 정리함
                        </h1>
                        <p className="mt-3 text-sm leading-7 text-text-secondary sm:text-base">
                            초대와 권한, 외부 전달, 데이터 가져오기를 한 화면에 쌓아두는 대신 운영자가 실제로 처리하는
                            순서대로 나눴습니다.
                        </p>
                    </div>
                    <div className="min-w-[220px] rounded-[24px] border border-white/10 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-text-tertiary">현재 역할</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{currentRole}</p>
                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                            {workspace.canManageSettings
                                ? '민감 설정과 연동 비밀값까지 직접 관리할 수 있습니다.'
                                : '민감 설정은 owner/admin만 편집할 수 있고, 현재 계정은 읽기 전용 안내만 봅니다.'}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 lg:grid-cols-3">
                    <SummaryCard
                        eyebrow="Workspace"
                        title={`${workspace.team?.memberCount ?? workspace.members.length} members / ${visibleChannelCount} channels`}
                        description="현재 설정은 이 워크스페이스 스냅샷 기준으로 동기화됩니다."
                    />
                    <SummaryCard
                        eyebrow="Delivery"
                        title={
                            hasGithubIntegration
                                ? `GitHub 연결됨 · relay ${bridgeEnabledCount}개 활성`
                                : `GitHub 미설정 · relay ${bridgeEnabledCount}개 활성`
                        }
                        description="webhook과 relay worker는 전달 섹션에서 바로 이어서 관리할 수 있습니다."
                    />
                    <SummaryCard
                        eyebrow="Imports"
                        title="Confluence / Discord 마이그레이션"
                        description="문서와 채팅 기록 가져오기는 별도 섹션으로 분리해 실수로 운영 설정을 덮지 않게 했습니다."
                    />
                </div>
            </section>

            {workspace.isInitialLoading ? (
                <div className="mt-6 rounded-[28px] border border-border-primary bg-bg-secondary p-6 text-sm text-text-secondary">
                    워크스페이스 스냅샷과 운영 권한을 불러오는 중...
                </div>
            ) : null}
            {workspace.error ? (
                <div className="mt-6 rounded-[28px] border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
                    {workspace.error}
                </div>
            ) : null}

            <nav className="mt-6 grid gap-3 lg:grid-cols-3" aria-label="설정 섹션">
                {SECTION_ITEMS.map((section) => (
                    <button
                        key={section.key}
                        type="button"
                        onClick={() => selectSection(section.key)}
                        aria-pressed={section.key === activeSection}
                        className={`rounded-[28px] border p-4 text-left transition ${
                            section.key === activeSection
                                ? 'border-brand-400/30 bg-brand-500/12 text-white shadow-[0_18px_48px_rgba(214,176,138,0.12)]'
                                : 'border-white/10 bg-bg-secondary text-text-secondary hover:bg-white/6'
                        }`}
                    >
                        <p className="text-[11px] uppercase tracking-[0.2em] text-brand-200">{section.eyebrow}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{section.label}</p>
                        <p className="mt-2 text-sm leading-6 text-text-secondary">{section.description}</p>
                    </button>
                ))}
            </nav>

            <section className="mt-6 space-y-6">
                <div className="max-w-2xl rounded-[28px] border border-white/10 bg-bg-secondary p-5 sm:p-6">
                    <p className="text-xs uppercase tracking-[0.24em] text-brand-200">{activeSectionMeta.eyebrow}</p>
                    <h2 className="mt-3 text-2xl font-bold text-white">{activeSectionMeta.label}</h2>
                    <p className="mt-3 text-sm leading-7 text-text-secondary">{activeSectionMeta.description}</p>
                </div>

                {activeSection === 'delivery' ? (
                    <>
                        <GitHubSettingsSection teamId={teamId} />
                        <ExternalBridgeSettingsPanel teamId={teamId} />
                    </>
                ) : null}

                {activeSection === 'access' ? <TeamInviteSettingsPanel teamId={teamId} /> : null}

                {activeSection === 'imports' ? (
                    <>
                        <ConfluenceImportPanel teamId={teamId} onImported={async () => {}} />
                        <DiscordImportPanel teamId={teamId} onImported={workspace.refreshBase} />
                    </>
                ) : null}

                {activeSection === 'operations' ? <TeamAuditLogPanel teamId={teamId} /> : null}
            </section>
        </div>
    );
}

interface SummaryCardProps {
    eyebrow: string;
    title: string;
    description: string;
}

function SummaryCard({ eyebrow, title, description }: SummaryCardProps) {
    return (
        <article className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-text-tertiary">{eyebrow}</p>
            <p className="mt-3 text-lg font-semibold text-white">{title}</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        </article>
    );
}
