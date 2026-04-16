'use client';

import { useEffect, useState } from 'react';
import { documentApi } from '@/lib/api-client';
import type { DocumentComment } from '@/src/entities/document/types';

export function useDocumentComments(teamId: string, documentId: string) {
    const [comments, setComments] = useState<DocumentComment[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setComments([]);
        setLoading(true);
        setError('');

        documentApi.getDocumentComments(teamId, documentId)
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
    }, [documentId, teamId]);

    const createComment = async (input: { content: string; anchorText?: string | null; parentId?: string | null }) => {
        setError('');
        const response = await documentApi.createDocumentComment(teamId, documentId, input);
        if (!response.success || !response.data) return null;
        const nextComment = response.data;
        setComments((current) => [...current, nextComment]);
        return nextComment;
    };

    const updateCommentStatus = async (commentId: string, resolved: boolean) => {
        setError('');
        const response = await documentApi.updateDocumentCommentStatus(teamId, documentId, commentId, resolved);
        if (!response.success || !response.data) return null;
        const updatedComment = response.data;
        setComments((current) => current.map((comment) => (comment.id === commentId ? updatedComment : comment)));
        return updatedComment;
    };

    return {
        comments,
        createComment,
        error,
        loading,
        setError,
        updateCommentStatus,
    };
}
