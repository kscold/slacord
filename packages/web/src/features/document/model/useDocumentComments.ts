'use client';

import { useEffect, useState } from 'react';
import { documentApi, unwrapApiArray, unwrapApiData } from '@/lib/api-client';
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
                setComments(unwrapApiArray<DocumentComment>(response));
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
        const created = unwrapApiData<DocumentComment>(response);
        if (!created) return null;
        setRefreshToken((current) => current + 1);
        return created;
    };

    const updateComment = async (commentId: string, content: string) => {
        setError('');
        const response = await documentApi.updateDocumentComment(teamId, documentId, commentId, { content });
        const updated = unwrapApiData<DocumentComment>(response);
        if (!updated) return null;
        setRefreshToken((current) => current + 1);
        return updated;
    };

    const updateCommentStatus = async (commentId: string, resolved: boolean) => {
        setError('');
        const response = await documentApi.updateDocumentCommentStatus(teamId, documentId, commentId, resolved);
        const updated = unwrapApiData<DocumentComment>(response);
        if (!updated) return null;
        setRefreshToken((current) => current + 1);
        return updated;
    };

    const deleteComment = async (commentId: string) => {
        setError('');
        const response = await documentApi.deleteDocumentComment(teamId, documentId, commentId);
        const deleted = unwrapApiData<DocumentComment>(response);
        if (!deleted) return null;
        setRefreshToken((current) => current + 1);
        return deleted;
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
