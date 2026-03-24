'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { documentApi } from '@/lib/api-client';
import type { DocumentNode } from '@/src/entities/document/types';
import { ConfluenceImportPanel } from '@/src/features/document/ui/ConfluenceImportPanel';
import { DocumentTree } from '@/src/widgets/document/ui/DocumentTree';

interface Props {
    params: Promise<{ teamId: string }>;
}

export default function DocsPage({ params }: Props) {
    const { teamId } = use(params);
    const [docs, setDocs] = useState<DocumentNode[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const loadDocuments = async () => {
        const response = await documentApi.getDocuments(teamId);
        if (response.success && Array.isArray(response.data)) setDocs(response.data as DocumentNode[]);
    };

    useEffect(() => {
        void loadDocuments();
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

    return (
        <div className="mx-auto max-w-4xl space-y-6 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">문서/위키</h2>
                <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-lg bg-slack-green text-white text-sm font-medium hover:bg-slack-green/90 transition-colors">
                    문서 생성
                </button>
            </div>

            <ConfluenceImportPanel teamId={teamId} onImported={loadDocuments} />

            {showCreate && (
                <form onSubmit={handleCreate} className="flex gap-3 mb-6">
                    <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="문서 제목" className="flex-1 bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slack-green/50" required />
                    <button type="submit" className="px-4 py-2 rounded-lg bg-slack-green text-white text-sm font-medium">생성</button>
                    <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border-primary text-text-secondary text-sm hover:text-white hover:bg-bg-hover transition-colors">취소</button>
                </form>
            )}

            <DocumentTree documents={docs} teamId={teamId} />
        </div>
    );
}
