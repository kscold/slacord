'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { documentApi } from '@/lib/api-client';
import type { DocumentNode } from '@/src/entities/document/types';
import { ConfirmationDialog } from '@/src/shared/ui/ConfirmationDialog';

interface Props {
    params: Promise<{ teamId: string }>;
}

export default function ArchivedDocsPage({ params }: Props) {
    const { teamId } = use(params);
    const [docs, setDocs] = useState<DocumentNode[]>([]);
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pendingDeleteDoc, setPendingDeleteDoc] = useState<DocumentNode | null>(null);

    const fetchArchived = async () => {
        const res = await documentApi.getArchivedDocuments(teamId);
        if (res.success && Array.isArray(res.data)) setDocs(res.data as DocumentNode[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchArchived();
    }, [teamId]);

    const handleRestore = async (docId: string) => {
        const res = await documentApi.restoreDocument(teamId, docId);
        if (res.success) setDocs((prev) => prev.filter((d) => d.id !== docId));
    };

    const handleDelete = (doc: DocumentNode) => {
        setDeleteError('');
        setPendingDeleteDoc(doc);
    };

    const confirmDelete = async () => {
        if (!pendingDeleteDoc) return;
        setDeleting(true);
        setDeleteError('');
        try {
            const res = await documentApi.deleteDocument(teamId, pendingDeleteDoc.id);
            if (res.success) {
                setDocs((prev) => prev.filter((d) => d.id !== pendingDeleteDoc.id));
                setPendingDeleteDoc(null);
            }
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : '문서를 삭제하지 못했습니다.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading)
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slack-green border-t-transparent" />
            </div>
        );

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">휴지통</h2>
                <Link
                    href={`/${teamId}/docs`}
                    className="text-sm text-text-secondary hover:text-white transition-colors"
                >
                    문서 목록으로
                </Link>
            </div>
            {deleteError ? (
                <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {deleteError}
                </div>
            ) : null}

            {docs.length === 0 ? (
                <p className="text-sm text-text-tertiary">삭제된 문서가 없어요.</p>
            ) : (
                <div className="space-y-3">
                    {docs.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center justify-between rounded-2xl border border-border-primary bg-bg-secondary p-4"
                        >
                            <div>
                                <p className="font-medium text-white">{doc.title}</p>
                                <p className="text-xs text-text-tertiary mt-1">
                                    삭제일: {doc.archivedAt ? new Date(doc.archivedAt).toLocaleString('ko-KR') : ''}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleRestore(doc.id)}
                                    className="px-3 py-1.5 rounded-lg bg-slack-green text-white text-sm font-medium hover:bg-slack-green/90 transition-colors"
                                >
                                    복원
                                </button>
                                <button
                                    onClick={() => handleDelete(doc)}
                                    className="px-3 py-1.5 rounded-lg border border-error/30 text-error text-sm hover:bg-error/10 transition-colors"
                                >
                                    영구 삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ConfirmationDialog
                busy={deleting}
                confirmLabel="영구 삭제"
                description={
                    pendingDeleteDoc
                        ? `${pendingDeleteDoc.title} 문서를 완전히 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
                        : ''
                }
                onClose={() => !deleting && setPendingDeleteDoc(null)}
                onConfirm={confirmDelete}
                open={Boolean(pendingDeleteDoc)}
                title="휴지통 문서를 영구 삭제할까요?"
                tone="danger"
            />
        </div>
    );
}
