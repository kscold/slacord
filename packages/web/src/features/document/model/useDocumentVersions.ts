'use client';

import { useEffect, useState } from 'react';
import { documentApi, unwrapApiArray, unwrapApiData } from '@/lib/api-client';
import type { DocumentFull, DocumentVersion } from '@/src/entities/document/types';

export function useDocumentVersions(teamId: string, docId: string) {
    const [loading, setLoading] = useState(true);
    const [versions, setVersions] = useState<DocumentVersion[]>([]);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const response = await documentApi.getDocumentVersions(teamId, docId);
            setVersions(unwrapApiArray<DocumentVersion>(response));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadVersions();
    }, [docId, teamId]);

    const restoreVersion = async (versionId: string) => {
        const response = await documentApi.restoreDocumentVersion(teamId, docId, versionId);
        const restored = unwrapApiData<DocumentFull>(response);
        if (!restored) return null;
        await loadVersions();
        return restored;
    };

    return { loading, restoreVersion, versions };
}
