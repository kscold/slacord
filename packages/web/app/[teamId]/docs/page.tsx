'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { documentApi } from '@/lib/api-client';
import type { DocumentNode } from '@/src/entities/document/types';

interface Props {
    params: Promise<{ teamId: string }>;
}

export default function DocsPage({ params }: Props) {
    const { teamId } = use(params);
    const [docs, setDocs] = useState<DocumentNode[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    useEffect(() => {
        documentApi.getDocuments(teamId).then((res) => {
            if (res.success && Array.isArray(res.data)) setDocs(res.data as DocumentNode[]);
        });
    }, [teamId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        const res = await documentApi.createDocument(teamId, { title: newTitle });
        if (res.success && res.data) {
            setDocs((prev) => [...prev, res.data as DocumentNode]);
            setNewTitle(''); setShowCreate(false);
        }
    };

    const rootDocs = docs.filter((d) => !d.parentId);

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">문서/위키</h2>
                <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-lg bg-slack-green text-white text-sm font-medium hover:bg-slack-green/90 transition-colors">
                    문서 생성
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="flex gap-3 mb-6">
                    <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="문서 제목" className="flex-1 bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slack-green/50" required />
                    <button type="submit" className="px-4 py-2 rounded-lg bg-slack-green text-white text-sm font-medium">생성</button>
                    <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border-primary text-text-secondary text-sm hover:text-white hover:bg-bg-hover transition-colors">취소</button>
                </form>
            )}

            <div className="space-y-2">
                {rootDocs.map((doc) => (
                    <Link key={doc.id} href={`/${teamId}/docs/${doc.id}`} className="flex items-center gap-3 p-4 bg-bg-secondary rounded-xl border border-border-primary hover:bg-bg-hover hover:border-slack-green/30 transition-all group">
                        <svg className="w-5 h-5 text-text-tertiary group-hover:text-slack-green transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="min-w-0">
                            <p className="text-white font-medium truncate">{doc.title}</p>
                            <p className="text-xs text-text-tertiary">{new Date(doc.updatedAt).toLocaleDateString('ko-KR')} 수정</p>
                        </div>
                    </Link>
                ))}
                {rootDocs.length === 0 && (
                    <p className="text-center text-text-tertiary py-12 text-sm">문서가 없습니다. 첫 문서를 만들어보세요!</p>
                )}
            </div>
        </div>
    );
}
