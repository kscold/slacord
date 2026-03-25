'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { documentApi } from '@/lib/api-client';
import { useDocumentDetail } from '@/src/features/document/model/useDocumentDetail';
import { useDocumentVersions } from '@/src/features/document/model/useDocumentVersions';
import { DocumentChildrenPanel } from '@/src/features/document/ui/DocumentChildrenPanel';
import { DocumentContent } from '@/src/features/document/ui/DocumentContent';
import { DocumentDetailHeader } from '@/src/features/document/ui/DocumentDetailHeader';
import { DocumentEditorPanel } from '@/src/features/document/ui/DocumentEditorPanel';
import { DocumentVersionPanel } from '@/src/features/document/ui/DocumentVersionPanel';
import type { DocumentFull } from '@/src/entities/document/types';

interface Props {
    params: Promise<{ teamId: string; docId: string }>;
}

export default function DocDetailPage({ params }: Props) {
    const { teamId, docId } = use(params);
    const router = useRouter();
    const { doc, setDoc, children, loading } = useDocumentDetail(teamId, docId);
    const { loading: versionLoading, restoreVersion, versions } = useDocumentVersions(teamId, docId);
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (!doc) return;
        setTitle(doc.title);
        setContent(doc.content);
    }, [doc]);

    const handleSave = async () => {
        const response = await documentApi.updateDocument(teamId, docId, { title, content, contentFormat: doc?.contentFormat ?? 'html' });
        if (!response.success || !response.data) return;
        const nextDoc = response.data as DocumentFull;
        setDoc(nextDoc);
        setTitle(nextDoc.title);
        setContent(nextDoc.content);
        setEditing(false);
    };

    const handleArchive = async () => {
        if (!confirm('이 문서를 아카이브할까요? 휴지통에서 복원할 수 있어요.')) return;
        const response = await documentApi.archiveDocument(teamId, docId);
        if (response.success) router.push(`/${teamId}/docs`);
    };

    const handleRestoreVersion = async (versionId: string) => {
        if (!confirm('이전 버전으로 복원할까요? 현재 문서 상태도 새 버전으로 보존됩니다.')) return;
        const restored = await restoreVersion(versionId);
        if (!restored) return;
        setDoc(restored);
        setTitle(restored.title);
        setContent(restored.content);
        setEditing(false);
    };

    if (loading || !doc) {
        return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slack-green border-t-transparent" /></div>;
    }

    return (
        <div className="mx-auto max-w-4xl p-6">
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
            <p className="mb-6 text-xs text-text-tertiary">마지막 수정: {new Date(doc.updatedAt).toLocaleString('ko-KR')}</p>
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
                <div className="min-h-48 rounded-xl border border-border-primary bg-bg-secondary p-6">
                    <DocumentContent doc={doc} />
                </div>
            )}
            <DocumentVersionPanel loading={versionLoading} onRestore={handleRestoreVersion} versions={versions} />
        </div>
    );
}
