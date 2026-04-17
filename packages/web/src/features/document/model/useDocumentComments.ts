'use client';

import { useEffect, useState } from 'react';
import { documentApi } from '@/lib/api-client';
import type { DocumentComment } from '@/src/entities/document/types';

export type DocumentCommentFilter = 'all' | 'open' | 'resolved';

export function useDocumentComments(teamId: string, documentId: string, filter: DocumentCommentFilter) {
    const [comments, setComments] = useState<DocumentComment[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshToken, setRefreshToken] = useState(0);

    useEffect(() => {
        let active = true;
        setComments([]);
        setLoading(true);
        setError('');

        documentApi.getDocumentComments(teamId, documentId, { status: filter })
            .then((response) => {
                if (!active) return;
                if (response.success && Array.isArray(response.data)) {
                    setComments(response.data);
                }
            })
            .catch((nextError: Error) => {
                if (!active) return;
                setError(nextError.message || '문서 코멘트를 불러오지 못했습니다.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [documentId, filter, refreshToken, teamId]);

    const createComment = async (input: { content: string; anchorText?: string | null; parentId?: string | null }) => {
        setError('');
        const response = await documentApi.createDocumentComment(teamId, documentId, input);
        if (!response.success || !response.data) return null;
        setRefreshToken((current) => current + 1);
        return response.data;
    };

    const updateComment = async (commentId: string, content: string) => {
        setError('');
        const response = await documentApi.updateDocumentComment(teamId, documentId, commentId, { content });
        if (!response.success || !response.data) return null;
        setRefreshToken((current) => current + 1);
        return response.data;
    };

    const updateCommentStatus = async (commentId: string, resolved: boolean) => {
        setError('');
        const response = await documentApi.updateDocumentCommentStatus(teamId, documentId, commentId, resolved);
        if (!response.success || !response.data) return null;
        setRefreshToken((current) => current + 1);
        return response.data;
    };

    const deleteComment = async (commentId: string) => {
        setError('');
        const response = await documentApi.deleteDocumentComment(teamId, documentId, commentId);
        if (!response.success || !response.data) return null;
        setRefreshToken((current) => current + 1);
        return response.data;
    };

    return {
        comments,
        createComment,
        deleteComment,
        error,
        loading,
        refreshComments: () => setRefreshToken((current) => current + 1),
        setError,
        updateComment,
        updateCommentStatus,
    };
}
