'use client';

import Link from 'next/link';
import { useId, useRef } from 'react';
import { useDashboardMessages } from '@/src/features/dashboard/model/useDashboardMessages';
import { SearchInput } from '@/src/widgets/dashboard/ui/search/SearchInput';
import { SearchResultList } from '@/src/widgets/dashboard/ui/search/SearchResultList';
import { useDialogFocusTrap } from '@/src/shared/ui/useDialogFocusTrap';

interface Props {
    onClose: () => void;
    open: boolean;
    restoreFocusRef?: React.RefObject<HTMLElement | null>;
}

export function WorkspaceSearchPalette({ onClose, open, restoreFocusRef }: Props) {
    const search = useDashboardMessages();
    const surfaceRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useDialogFocusTrap({
        initialFocusRef: closeButtonRef,
        onEscape: onClose,
        open,
        restoreFocusRef,
        surfaceRef,
    });

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
                className="flex w-full max-w-4xl max-h-[min(88vh,920px)] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-bg-primary shadow-2xl outline-none"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Quick Search</p>
                        <h2 id={titleId} className="mt-2 text-2xl font-bold text-white">
                            메시지 빠른 검색
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                            최근 메시지와 고정 메시지를 바로 보고, 필요한 대화로 바로 이동할 수 있습니다.
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
                        <span>어디서든 바로 열 수 있는 전역 검색 진입점입니다.</span>
                    </div>
                    <div className="mt-4">
                        <SearchInput autoFocus query={search.query} onChange={search.setQuery} />
                    </div>
                    {search.error ? <p className="mt-3 text-sm text-red-400">{search.error}</p> : null}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
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
            </div>
        </div>
    );
}
