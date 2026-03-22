'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { documentApi } from '@/lib/api-client';
import type { DocumentFull } from '@/src/entities/document/types';

interface Props {
    params: Promise<{ teamId: string; docId: string }>;
}

export default function DocDetailPage({ params }: Props) {
    const { teamId, docId } = use(params);
    const [doc, setDoc] = useState<DocumentFull | null>(null);
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        documentApi.getDocument(teamId, docId).then((res) => {
            if (res.success && res.data) {
                const d = res.data as DocumentFull;
                setDoc(d); setTitle(d.title); setContent(d.content);
            }
        });
    }, [teamId, docId]);

    const handleSave = async () => {
        const res = await documentApi.updateDocument(teamId, docId, { title, content });
        if (res.success && res.data) {
            setDoc(res.data as DocumentFull);
            setEditing(false);
        }
    };

    if (!doc) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slack-green border-t-transparent" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                {editing ? (
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 text-2xl font-bold text-white bg-transparent border-b border-slack-green/50 focus:outline-none mr-4" />
                ) : (
                    <h2 className="text-2xl font-bold text-white">{doc.title}</h2>
                )}
                <div className="flex gap-2 shrink-0">
                    {editing ? (
                        <>
                            <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg border border-border-primary text-text-secondary text-sm hover:text-white hover:bg-bg-hover transition-colors">취소</button>
                            <button onClick={handleSave} className="px-3 py-1.5 rounded-lg bg-slack-green text-white text-sm font-medium hover:bg-slack-green/90 transition-colors">저장</button>
                        </>
                    ) : (
                        <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg border border-border-primary text-text-secondary text-sm hover:text-white hover:bg-bg-hover transition-colors">편집</button>
                    )}
                </div>
            </div>

            <p className="text-xs text-text-tertiary mb-6">마지막 수정: {new Date(doc.updatedAt).toLocaleString('ko-KR')}</p>

            {editing ? (
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-bg-secondary border border-border-primary rounded-xl p-4 text-sm text-white focus:outline-none focus:border-slack-green/50 resize-none font-mono min-h-96"
                    placeholder="Markdown으로 작성하세요..."
                />
            ) : (
                <div className="bg-bg-secondary rounded-xl border border-border-primary p-6 min-h-48">
                    {doc.content ? (
                        <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans">{doc.content}</pre>
                    ) : (
                        <p className="text-text-tertiary text-sm">내용이 없습니다. 편집 버튼을 눌러 내용을 추가하세요.</p>
                    )}
                </div>
            )}
        </div>
    );
}
