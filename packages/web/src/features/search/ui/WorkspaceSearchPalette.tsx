'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useEffect, useId, useMemo, useRef, useState } from 'react';
import { channelApi, documentApi, issueApi } from '@/lib/api-client';
import { resolveChannelLabel } from '@/src/entities/channel/lib/resolveChannelLabel';
import type { Channel } from '@/src/entities/channel/types';
import type { DocumentNode } from '@/src/entities/document/types';
import type { Issue } from '@/src/entities/issue/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import { useDashboardMessages } from '@/src/features/dashboard/model/useDashboardMessages';
import { useDialogFocusTrap } from '@/src/shared/ui/useDialogFocusTrap';
import { SearchResultList } from '@/src/widgets/dashboard/ui/search/SearchResultList';
import { SearchInput } from '@/src/widgets/dashboard/ui/search/SearchInput';

interface WorkspacePaletteContext {
    canWrite: boolean;
    channels: Channel[];
    currentUserId: string;
    members: TeamMemberSummary[];
    teamId: string;
}

interface Props {
    onClose: () => void;
    open: boolean;
    restoreFocusRef?: React.RefObject<HTMLElement | null>;
    workspace?: WorkspacePaletteContext;
}

interface PaletteAction {
    description: string;
    id: string;
    label: string;
    run: () => void | Promise<void>;
}

export function WorkspaceSearchPalette({ onClose, open, restoreFocusRef, workspace }: Props) {
    const router = useRouter();
    const search = useDashboardMessages();
    const surfaceRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const [documents, setDocuments] = useState<DocumentNode[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [resourceError, setResourceError] = useState('');
    const [resourceLoading, setResourceLoading] = useState(false);
    const [resourcesTeamId, setResourcesTeamId] = useState('');
    const [actionError, setActionError] = useState('');
    const [busyActionId, setBusyActionId] = useState<string | null>(null);

    useDialogFocusTrap({
        initialFocusRef: closeButtonRef,
        onEscape: onClose,
        open,
        restoreFocusRef,
        surfaceRef,
    });

    useEffect(() => {
        if (!open || !workspace?.teamId) return;
        if (resourcesTeamId === workspace.teamId) return;

        let active = true;
        setResourceLoading(true);
        setResourceError('');

        Promise.all([documentApi.getDocuments(workspace.teamId), issueApi.getIssues(workspace.teamId)])
            .then(([documentsResponse, issuesResponse]) => {
                if (!active) return;
                if (documentsResponse.success && Array.isArray(documentsResponse.data)) {
                    setDocuments(documentsResponse.data as DocumentNode[]);
                } else {
                    setDocuments([]);
                }
                if (issuesResponse.success && Array.isArray(issuesResponse.data)) {
                    setIssues(issuesResponse.data as Issue[]);
                } else {
                    setIssues([]);
                }
                setResourcesTeamId(workspace.teamId);
            })
            .catch((error: Error) => {
                if (!active) return;
                setResourceError(error.message || '빠른 이동에 필요한 워크스페이스 데이터를 불러오지 못했습니다.');
            })
            .finally(() => {
                if (active) setResourceLoading(false);
            });

        return () => {
            active = false;
        };
    }, [documents.length, issues.length, open, resourceError, resourcesTeamId, workspace?.teamId]);

    const trimmedQuery = search.query.trim();
    const normalizedQuery = trimmedQuery.toLowerCase();
    const recentDocuments = useMemo(
        () => [...documents].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)),
        [documents],
    );
    const recentIssues = useMemo(
        () => [...issues].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)),
        [issues],
    );
    const channelTargets = useMemo(() => {
        if (!workspace) return [];
        const source = workspace.channels.map((channel) => ({
            channel,
            href: `/${workspace.teamId}/channel/${channel.id}`,
            label:
                channel.type === 'dm' || channel.type === 'group'
                    ? resolveChannelLabel(channel, workspace.members, workspace.currentUserId)
                    : `# ${channel.name}`,
            searchText:
                channel.type === 'dm' || channel.type === 'group'
                    ? resolveChannelLabel(channel, workspace.members, workspace.currentUserId)
                    : channel.name,
        }));
        return filterCollection(source, normalizedQuery, 6);
    }, [normalizedQuery, workspace]);
    const documentTargets = useMemo(
        () =>
            filterCollection(
                recentDocuments.map((document) => ({
                    document,
                    href: `/${document.teamId}/docs/${document.id}`,
                    label: document.title,
                    searchText: document.title,
                })),
                normalizedQuery,
                6,
            ),
        [normalizedQuery, recentDocuments],
    );
    const issueTargets = useMemo(
        () =>
            filterCollection(
                recentIssues.map((issue) => ({
                    issue,
                    href: `/${issue.teamId}/issues?issue=${issue.id}`,
                    label: issue.title,
                    searchText: issue.title,
                })),
                normalizedQuery,
                6,
            ),
        [normalizedQuery, recentIssues],
    );
    const quickActions = useMemo(() => {
        const actions: PaletteAction[] = [
            {
                id: 'dashboard-messages',
                label: '전체 메시지 검색 열기',
                description: '워크스페이스 메시지 검색 대시보드로 이동합니다.',
                run: () => navigateWithClose(router, onClose, '/dashboard/messages'),
            },
        ];

        if (!workspace) {
            actions.unshift(
                {
                    id: 'dashboard-home',
                    label: '대시보드 열기',
                    description: '워크스페이스 목록과 최근 활동을 확인합니다.',
                    run: () => navigateWithClose(router, onClose, '/dashboard'),
                },
                {
                    id: 'dashboard-new-team',
                    label: '새 팀 만들기',
                    description: '새 워크스페이스 생성 화면으로 이동합니다.',
                    run: () => navigateWithClose(router, onClose, '/dashboard/teams/new'),
                },
            );
            return filterCollection(actions, normalizedQuery, 8, ['label', 'description']);
        }

        actions.unshift(
            {
                id: 'workspace-issues',
                label: '이슈 보드 열기',
                description: '현재 워크스페이스의 이슈 보드로 이동합니다.',
                run: () => navigateWithClose(router, onClose, `/${workspace.teamId}/issues`),
            },
            {
                id: 'workspace-docs',
                label: '문서/위키 열기',
                description: '문서 트리와 최신 문서를 확인합니다.',
                run: () => navigateWithClose(router, onClose, `/${workspace.teamId}/docs`),
            },
            {
                id: 'workspace-announcements',
                label: '공지사항 열기',
                description: '공지 목록과 핀된 운영 소식을 확인합니다.',
                run: () => navigateWithClose(router, onClose, `/${workspace.teamId}/announcements`),
            },
            {
                id: 'workspace-settings',
                label: '워크스페이스 설정 열기',
                description: '연동, 초대, 운영 이력 설정 화면으로 이동합니다.',
                run: () => navigateWithClose(router, onClose, `/${workspace.teamId}/settings`),
            },
        );

        if (workspace.canWrite && trimmedQuery.length >= 2) {
            actions.unshift(
                {
                    id: 'create-channel',
                    label: `# ${trimmedQuery} 채널 생성`,
                    description: '새 공개 채널을 만들고 바로 대화 화면으로 이동합니다.',
                    run: async () => {
                        setActionError('');
                        setBusyActionId('create-channel');
                        try {
                            const response = await channelApi.createChannel(workspace.teamId, {
                                name: trimmedQuery,
                                type: 'public',
                            });
                            if (response.success && response.data?.id) {
                                startTransition(() => {
                                    onClose();
                                    router.push(`/${workspace.teamId}/channel/${response.data.id}`);
                                    router.refresh();
                                });
                            }
                        } catch (error) {
                            setActionError(error instanceof Error ? error.message : '채널을 생성하지 못했습니다.');
                        } finally {
                            setBusyActionId(null);
                        }
                    },
                },
                {
                    id: 'create-document',
                    label: `"${trimmedQuery}" 문서 생성`,
                    description: '새 문서를 만들고 블록 에디터를 바로 엽니다.',
                    run: async () => {
                        setActionError('');
                        setBusyActionId('create-document');
                        try {
                            const response = await documentApi.createDocument(workspace.teamId, {
                                title: trimmedQuery,
                                content: '',
                                contentFormat: 'json',
                            });
                            if (response.success && response.data?.id) {
                                startTransition(() => {
                                    onClose();
                                    router.push(`/${workspace.teamId}/docs/${response.data.id}?edit=1`);
                                    router.refresh();
                                });
                            }
                        } catch (error) {
                            setActionError(error instanceof Error ? error.message : '문서를 생성하지 못했습니다.');
                        } finally {
                            setBusyActionId(null);
                        }
                    },
                },
                {
                    id: 'create-issue',
                    label: `"${trimmedQuery}" 이슈 초안 열기`,
                    description: '제목이 채워진 생성 모달로 이동해 세부 정보를 입력합니다.',
                    run: () => {
                        const params = new URLSearchParams();
                        params.set('create', '1');
                        params.set('status', 'todo');
                        params.set('title', trimmedQuery);
                        navigateWithClose(router, onClose, `/${workspace.teamId}/issues?${params.toString()}`);
                    },
                },
            );
        }

        return filterCollection(actions, normalizedQuery, 8, ['label', 'description']);
    }, [normalizedQuery, onClose, router, trimmedQuery, workspace]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                ref={surfaceRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="flex w-full max-w-5xl max-h-[min(88vh,920px)] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-bg-primary shadow-2xl outline-none"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Quick Search</p>
                        <h2 id={titleId} className="mt-2 text-2xl font-bold text-white">
                            워크스페이스 빠른 검색
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                            메시지 검색 위에 채널, 문서, 이슈 이동과 빠른 생성 동작을 함께 묶었습니다.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/messages"
                            onClick={onClose}
                            className="rounded-full border border-white/10 px-3 py-2 text-xs text-text-secondary transition hover:bg-white/6 hover:text-white"
                        >
                            전체 검색 화면
                        </Link>
                        <button
                            ref={closeButtonRef}
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-white/10 px-3 py-2 text-xs text-text-secondary transition hover:bg-white/6 hover:text-white"
                        >
                            닫기
                        </button>
                    </div>
                </div>

                <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-white">
                            {typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac') ? '⌘K' : 'Ctrl+K'}
                        </span>
                        <span>메시지 검색과 quick action을 한 번에 여는 전역 팔레트입니다.</span>
                    </div>
                    <div className="mt-4">
                        <SearchInput
                            ariaLabel="명령 팔레트 검색"
                            autoFocus
                            placeholder="메시지, 문서, 이슈, 채널, 동작으로 검색..."
                            query={search.query}
                            onChange={search.setQuery}
                        />
                    </div>
                    {search.error ? <p className="mt-3 text-sm text-red-400">{search.error}</p> : null}
                    {resourceError ? <p className="mt-3 text-sm text-red-400">{resourceError}</p> : null}
                    {actionError ? <p className="mt-3 text-sm text-red-400">{actionError}</p> : null}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                    <section>
                        <SectionHeader
                            eyebrow="Quick Actions"
                            title={workspace ? '채널, 문서, 이슈 quick action' : '대시보드 quick action'}
                            description={
                                workspace
                                    ? '현재 워크스페이스 맥락에서 자주 여는 화면과 생성 동작을 먼저 배치했습니다.'
                                    : '대시보드 화면에서 바로 열 수 있는 공용 동작입니다.'
                            }
                        />
                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                            {quickActions.map((action) => (
                                <ActionCard
                                    key={action.id}
                                    action={action}
                                    busy={busyActionId === action.id}
                                />
                            ))}
                            {quickActions.length === 0 ? (
                                <EmptyState copy="현재 검색어에 맞는 quick action을 찾지 못했습니다." />
                            ) : null}
                        </div>
                    </section>

                    {workspace ? (
                        <>
                            <section className="mt-8">
                                <SectionHeader
                                    eyebrow="Workspace"
                                    title="채널, 문서, 이슈로 바로 이동"
                                    description="최근 업데이트나 검색어에 맞는 워크스페이스 리소스를 빠르게 엽니다."
                                />
                                {resourceLoading ? (
                                    <div className="mt-4 rounded-[28px] border border-border-primary bg-bg-secondary px-6 py-10 text-center text-sm text-text-secondary">
                                        채널, 문서, 이슈 목록을 불러오는 중...
                                    </div>
                                ) : (
                                    <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                        <ResourceSection
                                            items={channelTargets.map((target) => ({
                                                href: target.href,
                                                label: target.label,
                                                meta:
                                                    target.channel.type === 'public'
                                                        ? '공개 채널'
                                                        : target.channel.type === 'private'
                                                          ? '비공개 채널'
                                                          : target.channel.type === 'voice'
                                                            ? '음성 채널'
                                                            : '직접 대화',
                                            }))}
                                            title="채널"
                                            onClose={onClose}
                                            emptyCopy="조건에 맞는 채널이 없습니다."
                                        />
                                        <ResourceSection
                                            items={documentTargets.map((target) => ({
                                                href: target.href,
                                                label: target.label,
                                                meta: formatTimestamp(target.document.updatedAt),
                                            }))}
                                            title="문서"
                                            onClose={onClose}
                                            emptyCopy="조건에 맞는 문서를 찾지 못했습니다."
                                        />
                                        <ResourceSection
                                            items={issueTargets.map((target) => ({
                                                href: target.href,
                                                label: target.label,
                                                meta: formatTimestamp(target.issue.updatedAt),
                                            }))}
                                            title="이슈"
                                            onClose={onClose}
                                            emptyCopy="조건에 맞는 이슈가 없습니다."
                                        />
                                    </div>
                                )}
                            </section>
                        </>
                    ) : null}

                    <section className="mt-8">
                        <SectionHeader
                            eyebrow="Messages"
                            title="메시지 검색 결과"
                            description="최근 메시지, 고정 메시지, 검색 결과를 그대로 이어서 확인할 수 있습니다."
                        />
                        <div className="mt-4">
                            {search.booting ? (
                                <div className="rounded-[28px] border border-border-primary bg-bg-secondary px-6 py-16 text-center text-sm text-text-secondary">
                                    검색에 필요한 워크스페이스 정보를 불러오는 중...
                                </div>
                            ) : (
                                <SearchResultList
                                    indexing={search.indexing}
                                    onSelectResult={onClose}
                                    pinnedResults={search.pinnedResults}
                                    query={search.query}
                                    recentResults={search.recentResults}
                                    results={search.results}
                                    teamCount={search.teamCount}
                                />
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function SectionHeader({
    description,
    eyebrow,
    title,
}: {
    description: string;
    eyebrow: string;
    title: string;
}) {
    return (
        <div>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-200">{eyebrow}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        </div>
    );
}

function ActionCard({ action, busy }: { action: PaletteAction; busy: boolean }) {
    return (
        <button
            type="button"
            onClick={() => void action.run()}
            disabled={busy}
            className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-brand-400/30 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
        >
            <p className="text-sm font-semibold text-white">{busy ? '처리 중...' : action.label}</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{action.description}</p>
        </button>
    );
}

function ResourceSection({
    emptyCopy,
    items,
    onClose,
    title,
}: {
    emptyCopy: string;
    items: Array<{ href: string; label: string; meta: string }>;
    onClose: () => void;
    title: string;
}) {
    return (
        <article className="rounded-[28px] border border-white/10 bg-bg-secondary p-4">
            <p className="text-sm font-semibold text-white">{title}</p>
            {items.length === 0 ? <p className="mt-3 text-sm text-text-secondary">{emptyCopy}</p> : null}
            <div className="mt-3 space-y-2">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className="block rounded-2xl border border-white/8 bg-black/20 px-3 py-3 transition hover:bg-black/30"
                    >
                        <p className="truncate text-sm font-medium text-white">{item.label}</p>
                        <p className="mt-1 text-xs text-text-tertiary">{item.meta}</p>
                    </Link>
                ))}
            </div>
        </article>
    );
}

function EmptyState({ copy }: { copy: string }) {
    return (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-text-secondary">
            {copy}
        </div>
    );
}

function filterCollection<T>(
    items: T[],
    normalizedQuery: string,
    limit: number,
    searchKeys: string[] = ['searchText'],
) {
    const filtered = normalizedQuery
        ? items.filter((item) =>
              searchKeys.some((key) =>
                  String((item as Record<string, unknown>)[key] ?? '')
                      .toLowerCase()
                      .includes(normalizedQuery),
              ),
          )
        : items;
    return filtered.slice(0, limit);
}

function formatTimestamp(value: string) {
    return new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function navigateWithClose(router: ReturnType<typeof useRouter>, onClose: () => void, href: string) {
    startTransition(() => {
        onClose();
        router.push(href);
    });
}
