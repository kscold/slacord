'use client';

import { useEffect, useState } from 'react';
import { documentApi } from '@/lib/api-client';
import type { DocumentFull, DocumentVersion } from '@/src/entities/document/types';

export function useDocumentVersions(teamId: string, docId: string) {
    const [loading, setLoading] = useState(true);
    const [versions, setVersions] = useState<DocumentVersion[]>([]);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const response = await documentApi.getDocumentVersions(teamId, docId);
            if (response.success && Array.isArray(response.data)) setVersions(response.data as DocumentVersion[]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadVersions();
    }, [docId, teamId]);

    const restoreVersion = async (versionId: string) => {
        const response = await documentApi.restoreDocumentVersion(teamId, docId, versionId);
        if (!response.success || !response.data) return null;
        await loadVersions();
        return response.data as DocumentFull;
    };

    return { loading, restoreVersion, versions };
}
