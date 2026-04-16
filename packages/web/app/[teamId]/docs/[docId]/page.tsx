'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { documentApi } from '@/lib/api-client';
import { useTeamWorkspaceData } from '@/src/features/team/model/useTeamWorkspaceData';
import { useDocumentDetail } from '@/src/features/document/model/useDocumentDetail';
import { useDocumentVersions } from '@/src/features/document/model/useDocumentVersions';
import { DocumentChildrenPanel } from '@/src/features/document/ui/DocumentChildrenPanel';
import { DocumentCommentPanel } from '@/src/features/document/ui/DocumentCommentPanel';
import { DocumentContent } from '@/src/features/document/ui/DocumentContent';
import { DocumentDetailHeader } from '@/src/features/document/ui/DocumentDetailHeader';
import dynamic from 'next/dynamic';
const DocumentEditorPanel = dynamic(
    () => import('@/src/features/document/ui/DocumentEditorPanel').then((m) => m.DocumentEditorPanel),
    { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-xl bg-bg-secondary" /> },
);
import { DocumentVersionPanel } from '@/src/features/document/ui/DocumentVersionPanel';
import type { DocumentFull } from '@/src/entities/document/types';
import { ConfirmationDialog } from '@/src/shared/ui/ConfirmationDialog';

type PendingConfirmation = { kind: 'archive' } | { kind: 'restore-version'; versionId: string };

interface Props {
    params: Promise<{ teamId: string; docId: string }>;
}

export default function DocDetailPage({ params }: Props) {
    const { teamId, docId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { doc, setDoc, children, loading } = useDocumentDetail(teamId, docId);
    const workspace = useTeamWorkspaceData(teamId);
    const { loading: versionLoading, restoreVersion, versions } = useDocumentVersions(teamId, docId);
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [actionError, setActionError] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
    const [selectedQuote, setSelectedQuote] = useState<string | null>(null);

    useEffect(() => {
        if (!doc) return;
        setTitle(doc.title);
        setContent(doc.content);
        if (searchParams.get('edit') === '1' && doc.canEdit !== false) {
            setEditing(true);
        }
    }, [doc, searchParams]);

    useEffect(() => {
        if (editing) {
            setSelectedQuote(null);
        }
    }, [editing]);

    const handleSave = async () => {
        const response = await documentApi.updateDocument(teamId, docId, {
            title,
            content,
            contentFormat: doc?.contentFormat ?? 'html',
        });
        if (!response.success || !response.data) return;
        const nextDoc = response.data as DocumentFull;
        setDoc(nextDoc);
        setTitle(nextDoc.title);
        setContent(nextDoc.content);
        setEditing(false);
    };

    const handleArchive = () => {
        setActionError('');
        setPendingConfirmation({ kind: 'archive' });
    };

    const handleRestoreVersion = (versionId: string) => {
        setActionError('');
        setPendingConfirmation({ kind: 'restore-version', versionId });
    };

    const handleConfirmAction = async () => {
        if (!pendingConfirmation) return;
        setConfirming(true);
        setActionError('');

        try {
            if (pendingConfirmation.kind === 'archive') {
                const response = await documentApi.archiveDocument(teamId, docId);
                if (response.success) {
                    setPendingConfirmation(null);
                    router.push(`/${teamId}/docs`);
                }
                return;
            }

            const restored = await restoreVersion(pendingConfirmation.versionId);
            if (!restored) {
                setActionError('선택한 버전을 복원하지 못했습니다.');
                return;
            }
            setDoc(restored);
            setTitle(restored.title);
            setContent(restored.content);
            setEditing(false);
            setPendingConfirmation(null);
        } catch (error) {
            setActionError(error instanceof Error ? error.message : '문서 작업에 실패했습니다.');
        } finally {
            setConfirming(false);
        }
    };

    const confirmationCopy =
        pendingConfirmation?.kind === 'restore-version'
            ? {
                  confirmLabel: '이 버전으로 복원',
                  description: '현재 문서 상태도 새 버전으로 보존되고, 선택한 버전 내용이 본문에 다시 반영됩니다.',
                  title: '이전 버전으로 복원할까요?',
                  tone: 'primary' as const,
              }
            : {
                  confirmLabel: '아카이브',
                  description: '문서는 휴지통으로 이동하며, 워크스페이스의 휴지통 화면에서 다시 복원할 수 있습니다.',
                  title: '문서를 아카이브할까요?',
                  tone: 'danger' as const,
              };

    if (loading || !doc) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slack-green border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            <DocumentDetailHeader
                doc={doc}
                editing={editing}
                onArchive={handleArchive}
                onCancel={() => setEditing(false)}
                onEdit={() => setEditing(true)}
                onSave={handleSave}
                onTitleChange={setTitle}
                title={title}
            />
            <p className="mb-6 text-xs text-text-tertiary">
                마지막 수정: {new Date(doc.updatedAt).toLocaleString('ko-KR')}
            </p>
            {actionError ? (
                <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {actionError}
                </div>
            ) : null}
            <DocumentChildrenPanel teamId={teamId} children={children} />
            {editing ? (
                <DocumentEditorPanel
                    contentFormat={doc.contentFormat ?? 'plain'}
                    documentId={docId}
                    initialContent={doc.content}
                    onChange={setContent}
                    syncKey={`${doc.id}:${doc.updatedAt}`}
                    teamId={teamId}
                />
            ) : (
                <div className="min-h-48 overflow-hidden rounded-xl border border-border-primary bg-bg-secondary p-4 sm:p-6">
                    <DocumentContent doc={doc} onQuoteSelection={setSelectedQuote} />
                </div>
            )}
            <DocumentCommentPanel
                canComment={workspace.canWrite}
                currentUserId={workspace.currentUserId}
                doc={doc}
                documentId={docId}
                members={workspace.members}
                onClearSelectedQuote={() => setSelectedQuote(null)}
                selectedQuote={selectedQuote}
                teamId={teamId}
            />
            <DocumentVersionPanel loading={versionLoading} onRestore={handleRestoreVersion} versions={versions} />
            <ConfirmationDialog
                busy={confirming}
                confirmLabel={confirmationCopy.confirmLabel}
                description={confirmationCopy.description}
                onClose={() => !confirming && setPendingConfirmation(null)}
                onConfirm={handleConfirmAction}
                open={Boolean(pendingConfirmation)}
                title={confirmationCopy.title}
                tone={confirmationCopy.tone}
            />
        </div>
    );
}
