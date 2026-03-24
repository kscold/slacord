'use client';

import { use, useEffect, useState } from 'react';
import { documentApi } from '@/lib/api-client';
import { useDocumentDetail } from '@/src/features/document/model/useDocumentDetail';
import { DocumentChildrenPanel } from '@/src/features/document/ui/DocumentChildrenPanel';
import { DocumentContent } from '@/src/features/document/ui/DocumentContent';
import type { DocumentFull } from '@/src/entities/document/types';

interface Props {
    params: Promise<{ teamId: string; docId: string }>;
}

export default function DocDetailPage({ params }: Props) {
    const { teamId, docId } = use(params);
    const { doc, setDoc, children, loading } = useDocumentDetail(teamId, docId);
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (!doc) return;
        setTitle(doc.title);
        setContent(doc.content);
    }, [doc]);

    const handleSave = async () => {
        const res = await documentApi.updateDocument(teamId, docId, { title, content });
        if (res.success && res.data) {
            const nextDoc = res.data as DocumentFull;
            setDoc(nextDoc);
            setTitle(nextDoc.title);
            setContent(nextDoc.content);
            setEditing(false);
        }
    };

    if (loading || !doc) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slack-green border-t-transparent" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                {editing ? (
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 text-2xl font-bold text-white bg-transparent border-b border-slack-green/50 focus:outline-none mr-4" />
                ) : (
                    <div>
                        <h2 className="text-2xl font-bold text-white">{doc.title}</h2>
                        {doc.externalUrl ? <a href={doc.externalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs text-brand-100 underline underline-offset-4">Confluence 원본 열기</a> : null}
                    </div>
                )}
                <div className="flex gap-2 shrink-0">
                    {editing ? (
                        <>
                            <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg border border-border-primary text-text-secondary text-sm hover:text-white hover:bg-bg-hover transition-colors">취소</button>
                            <button onClick={handleSave} className="px-3 py-1.5 rounded-lg bg-slack-green text-white text-sm font-medium hover:bg-slack-green/90 transition-colors">저장</button>
                        </>
                    ) : (
                        <>
                            {doc.canEdit !== false && (
                                <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg border border-border-primary text-text-secondary text-sm hover:text-white hover:bg-bg-hover transition-colors">편집</button>
                            )}
                            {doc.visibility === 'restricted' && (
                                <span className="px-2 py-1 rounded-full bg-warning/20 text-warning text-xs">제한 문서</span>
                            )}
                        </>
                    )}
                </div>
            </div>

            <p className="text-xs text-text-tertiary mb-6">마지막 수정: {new Date(doc.updatedAt).toLocaleString('ko-KR')}</p>
            <DocumentChildrenPanel teamId={teamId} children={children} />

            {editing ? (
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-bg-secondary border border-border-primary rounded-xl p-4 text-sm text-white focus:outline-none focus:border-slack-green/50 resize-none font-mono min-h-96"
                    placeholder={doc.contentFormat === 'html' ? '가져온 HTML 원문을 수정합니다...' : 'Markdown으로 작성하세요...'}
                />
            ) : (
                <div className="bg-bg-secondary rounded-xl border border-border-primary p-6 min-h-48">
                    <DocumentContent doc={doc} />
                </div>
            )}
        </div>
    );
}
