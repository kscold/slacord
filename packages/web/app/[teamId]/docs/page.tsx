'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, documentApi, teamApi } from '@/lib/api-client';
import { hasTeamWriteAccess, resolveCurrentTeamMember } from '@/src/entities/team/lib/access';
import type { DocumentNode } from '@/src/entities/document/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import { DocumentTree } from '@/src/widgets/document/ui/DocumentTree';

interface Props {
    params: Promise<{ teamId: string }>;
}

export default function DocsPage({ params }: Props) {
    const { teamId } = use(params);
    const router = useRouter();
    const [docs, setDocs] = useState<DocumentNode[]>([]);
    const [canWrite, setCanWrite] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const loadDocuments = async () => {
        const response = await documentApi.getDocuments(teamId);
        if (response.success && Array.isArray(response.data)) setDocs(response.data as DocumentNode[]);
    };

    useEffect(() => {
        void loadDocuments();
    }, [teamId]);

    useEffect(() => {
        let active = true;
        Promise.all([authApi.getMe().catch(() => null), teamApi.getMembers(teamId).catch(() => null)]).then(([meRes, memberRes]) => {
            if (!active) return;
            const currentUserId = (meRes?.data as { id?: string } | undefined)?.id ?? '';
            const members = memberRes?.success && Array.isArray(memberRes.data) ? (memberRes.data as TeamMemberSummary[]) : [];
            setCanWrite(hasTeamWriteAccess(resolveCurrentTeamMember(members, currentUserId)?.role));
        });
        return () => {
            active = false;
        };
    }, [teamId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canWrite) return;
        if (!newTitle.trim()) return;
        const res = await documentApi.createDocument(teamId, { title: newTitle, content: '', contentFormat: 'json' });
        if (res.success && res.data) {
            const nextDoc = res.data as DocumentNode;
            setDocs((prev) => [...prev, nextDoc]);
            setNewTitle(''); setShowCreate(false);
            router.push(`/${teamId}/docs/${nextDoc.id}?edit=1`);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">문서/위키</h2>
                    <p className="mt-2 text-sm text-text-tertiary">{canWrite ? '문서를 찾고, 폴더를 펼쳐보고, 새 문서를 바로 블록 에디터로 시작할 수 있습니다.' : 'guest는 문서를 읽고 탐색할 수 있지만 새 문서를 만들 수는 없습니다.'}</p>
                </div>
                {canWrite ? (
                    <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-lg bg-slack-green text-white text-sm font-medium hover:bg-slack-green/90 transition-colors">
                        문서 생성
                    </button>
                ) : null}
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="mb-6 flex flex-col gap-3 sm:flex-row">
                    <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="문서 제목" className="flex-1 bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slack-green/50" required />
                    <button type="submit" className="px-4 py-2 rounded-lg bg-slack-green text-white text-sm font-medium">생성</button>
                    <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border-primary text-text-secondary text-sm hover:text-white hover:bg-bg-hover transition-colors">취소</button>
                </form>
            )}

            <DocumentTree documents={docs} teamId={teamId} />
        </div>
    );
}
