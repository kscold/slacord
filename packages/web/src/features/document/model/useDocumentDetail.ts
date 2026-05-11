'use client';

import { useEffect, useMemo, useState } from 'react';
import { documentApi, unwrapApiArray, unwrapApiData } from '@/lib/api-client';
import type { DocumentFull, DocumentNode } from '@/src/entities/document/types';

export function useDocumentDetail(teamId: string, docId: string) {
    const [doc, setDoc] = useState<DocumentFull | null>(null);
    const [documents, setDocuments] = useState<DocumentNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([documentApi.getDocument(teamId, docId), documentApi.getDocuments(teamId)])
            .then(([docResponse, docsResponse]) => {
                if (!active) return;
                const docData = unwrapApiData<DocumentFull>(docResponse);
                if (docData) setDoc(docData);
                if (docsResponse.success) setDocuments(unwrapApiArray<DocumentNode>(docsResponse));
            })
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [docId, teamId]);

    const children = useMemo(() => documents.filter((item) => item.parentId === docId).sort((left, right) => left.title.localeCompare(right.title, 'ko')), [docId, documents]);

    return { doc, setDoc, children, loading };
}
