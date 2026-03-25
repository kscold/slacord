'use client';

import type { DocumentVersion } from '@/src/entities/document/types';

interface Props {
    loading: boolean;
    onRestore: (versionId: string) => Promise<void>;
    versions: DocumentVersion[];
}

export function DocumentVersionPanel({ loading, onRestore, versions }: Props) {
    return (
        <div className="mt-6 rounded-2xl border border-border-primary bg-bg-secondary p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-white">버전 히스토리</p>
                    <p className="text-xs text-text-tertiary">수정 전 스냅샷과 초기 생성본을 여기서 복원할 수 있음.</p>
                </div>
                <span className="rounded-full bg-bg-tertiary px-2.5 py-1 text-xs text-text-secondary">{versions.length}개</span>
            </div>
            {loading ? <p className="text-sm text-text-tertiary">버전 목록 불러오는 중...</p> : null}
            {!loading && versions.length === 0 ? <p className="text-sm text-text-tertiary">저장된 버전이 아직 없음.</p> : null}
            <div className="space-y-3">
                {versions.map((version) => (
                    <div key={version.id} className="rounded-xl border border-border-primary/70 bg-bg-tertiary p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-white">{version.title}</p>
                                <p className="mt-1 text-xs text-text-tertiary">{new Date(version.createdAt).toLocaleString('ko-KR')} · {version.contentFormat.toUpperCase()}</p>
                            </div>
                            <button onClick={() => void onRestore(version.id)} className="rounded-lg border border-slack-green/30 px-3 py-1.5 text-xs font-medium text-slack-green transition hover:bg-slack-green/10">
                                이 버전으로 복원
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
