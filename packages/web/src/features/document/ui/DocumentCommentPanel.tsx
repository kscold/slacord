'use client';

import { useState } from 'react';
import type { DocumentComment, DocumentFull } from '@/src/entities/document/types';
import type { TeamMemberSummary } from '@/src/entities/team/types';
import { useDocumentComments } from '../model/useDocumentComments';

interface Props {
    teamId: string;
    documentId: string;
    doc: DocumentFull;
    members: TeamMemberSummary[];
    currentUserId: string;
    canComment: boolean;
    selectedQuote: string | null;
    onClearSelectedQuote: () => void;
}

export function DocumentCommentPanel({
    teamId,
    documentId,
    doc,
    members,
    currentUserId,
    canComment,
    selectedQuote,
    onClearSelectedQuote,
}: Props) {
    const { comments, createComment, error, loading, setError, updateCommentStatus } = useDocumentComments(teamId, documentId);
    const [draft, setDraft] = useState('');
    const [busyCommentId, setBusyCommentId] = useState('');
    const [openReplyForId, setOpenReplyForId] = useState('');
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const rootComments = comments.filter((comment) => !comment.parentId);
    const repliesByParentId = comments.reduce<Record<string, DocumentComment[]>>((acc, comment) => {
        if (!comment.parentId) return acc;
        acc[comment.parentId] = [...(acc[comment.parentId] ?? []), comment];
        return acc;
    }, {});

    const handleCreateRootComment = async () => {
        if (!canComment) return;
        setSubmitting(true);
        try {
            const created = await createComment({
                content: draft,
                anchorText: selectedQuote,
            });
            if (!created) return;
            setDraft('');
            onClearSelectedQuote();
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : '문서 코멘트를 저장하지 못했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateReply = async (parentId: string) => {
        const content = replyDrafts[parentId] ?? '';
        if (!canComment) return;
        setBusyCommentId(parentId);
        try {
            const created = await createComment({
                content,
                parentId,
            });
            if (!created) return;
            setReplyDrafts((current) => ({ ...current, [parentId]: '' }));
            setOpenReplyForId('');
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : '답글을 저장하지 못했습니다.');
        } finally {
            setBusyCommentId('');
        }
    };

    const handleToggleResolved = async (comment: DocumentComment) => {
        setBusyCommentId(comment.id);
        try {
            await updateCommentStatus(comment.id, !comment.resolvedAt);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : '코멘트 상태를 변경하지 못했습니다.');
        } finally {
            setBusyCommentId('');
        }
    };

    return (
        <section className="mt-6 rounded-3xl border border-border-primary bg-bg-secondary/80 p-5 sm:p-6" aria-label="문서 토론">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-text-primary">문서 토론</h2>
                    <p className="mt-1 text-sm text-text-tertiary">
                        선택한 문장을 인용하거나, 문서 전체에 대한 질문과 결정사항을 남길 수 있습니다.
                    </p>
                </div>
                <span className="rounded-full border border-border-primary px-3 py-1 text-xs text-text-tertiary">
                    {comments.length}개 코멘트
                </span>
            </div>

            {selectedQuote ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-200/80">선택 인용</p>
                            <p className="mt-2 text-sm text-emerald-50">"{selectedQuote}"</p>
                        </div>
                        <button
                            className="rounded-full border border-emerald-200/20 px-3 py-1 text-xs text-emerald-100 transition hover:border-emerald-100/40 hover:text-white"
                            onClick={onClearSelectedQuote}
                            type="button"
                        >
                            인용 해제
                        </button>
                    </div>
                </div>
            ) : null}

            {canComment ? (
                <div className="mt-4 rounded-2xl border border-border-primary bg-bg-primary/40 p-4">
                    <label className="text-sm font-medium text-text-secondary" htmlFor="document-comment-root">
                        새 코멘트
                    </label>
                    <textarea
                        className="mt-2 min-h-28 w-full rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 text-sm text-text-primary outline-none transition focus:border-emerald-400/60"
                        id="document-comment-root"
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="예: @username 이 단락 기준으로 실행 순서를 정리해 주세요."
                        value={draft}
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-text-tertiary">
                            <code className="rounded bg-bg-primary px-1.5 py-0.5 text-[11px] text-text-secondary">@username</code>
                            {' '}형식으로 팀원을 멘션하면 알림이 전달됩니다.
                        </p>
                        <button
                            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={submitting || !draft.trim()}
                            onClick={handleCreateRootComment}
                            type="button"
                        >
                            {submitting ? '저장 중...' : '코멘트 남기기'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-border-primary bg-bg-primary/40 px-4 py-3 text-sm text-text-tertiary">
                    읽기 전용 멤버는 문서를 볼 수 있지만 새 코멘트나 답글은 남길 수 없습니다.
                </div>
            )}

            {error ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="mt-4 space-y-3">
                    <div className="h-24 animate-pulse rounded-2xl bg-bg-primary" />
                    <div className="h-24 animate-pulse rounded-2xl bg-bg-primary" />
                </div>
            ) : rootComments.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-border-primary px-4 py-6 text-sm text-text-tertiary">
                    아직 코멘트가 없습니다. 중요한 문장이나 결정 포인트를 남겨 두면 다음 문서 작업이 훨씬 쉬워집니다.
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    {rootComments.map((comment) => {
                        const replies = repliesByParentId[comment.id] ?? [];
                        const canManageStatus = comment.createdBy === currentUserId || doc.canEdit === true;
                        const author = resolveMemberMeta(members, comment.createdBy);

                        return (
                            <article key={comment.id} className="rounded-2xl border border-border-primary bg-bg-primary/50 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-text-primary">{author.username}</p>
                                            {comment.resolvedAt ? (
                                                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-100">
                                                    해결됨
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 text-xs text-text-tertiary">
                                            {new Date(comment.createdAt).toLocaleString('ko-KR')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canComment ? (
                                            <button
                                                className="rounded-full border border-border-primary px-3 py-1 text-xs text-text-secondary transition hover:border-emerald-400/50 hover:text-text-primary"
                                                onClick={() => {
                                                    setOpenReplyForId((current) => (current === comment.id ? '' : comment.id));
                                                    setError('');
                                                }}
                                                type="button"
                                            >
                                                답글
                                            </button>
                                        ) : null}
                                        {canManageStatus ? (
                                            <button
                                                className="rounded-full border border-border-primary px-3 py-1 text-xs text-text-secondary transition hover:border-emerald-400/50 hover:text-text-primary disabled:opacity-50"
                                                disabled={busyCommentId === comment.id}
                                                onClick={() => handleToggleResolved(comment)}
                                                type="button"
                                            >
                                                {comment.resolvedAt ? '다시 열기' : '해결 처리'}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>

                                {comment.anchorText ? (
                                    <blockquote className="mt-3 rounded-2xl border-l-4 border-emerald-400/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                                        "{comment.anchorText}"
                                    </blockquote>
                                ) : null}

                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{comment.content}</p>

                                {replies.length > 0 ? (
                                    <div className="mt-4 space-y-3 border-t border-border-primary pt-4">
                                        {replies.map((reply) => {
                                            const replyAuthor = resolveMemberMeta(members, reply.createdBy);
                                            return (
                                                <div key={reply.id} className="rounded-2xl bg-bg-secondary px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-text-primary">{replyAuthor.username}</p>
                                                        <p className="text-xs text-text-tertiary">
                                                            {new Date(reply.createdAt).toLocaleString('ko-KR')}
                                                        </p>
                                                    </div>
                                                    <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{reply.content}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : null}

                                {canComment && openReplyForId === comment.id ? (
                                    <div className="mt-4 rounded-2xl border border-border-primary bg-bg-secondary p-4">
                                        <label className="text-xs font-medium uppercase tracking-[0.16em] text-text-tertiary" htmlFor={`reply-${comment.id}`}>
                                            답글 남기기
                                        </label>
                                        <textarea
                                            className="mt-2 min-h-24 w-full rounded-2xl border border-border-primary bg-bg-primary px-4 py-3 text-sm text-text-primary outline-none transition focus:border-emerald-400/60"
                                            id={`reply-${comment.id}`}
                                            onChange={(event) =>
                                                setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))
                                            }
                                            placeholder={`${author.username}에게 이어서 남길 답글을 입력하세요.`}
                                            value={replyDrafts[comment.id] ?? ''}
                                        />
                                        <div className="mt-3 flex justify-end gap-2">
                                            <button
                                                className="rounded-full border border-border-primary px-3 py-1.5 text-sm text-text-secondary transition hover:text-text-primary"
                                                onClick={() => setOpenReplyForId('')}
                                                type="button"
                                            >
                                                닫기
                                            </button>
                                            <button
                                                className="rounded-full bg-emerald-400 px-4 py-1.5 text-sm font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                                                disabled={busyCommentId === comment.id || !(replyDrafts[comment.id] ?? '').trim()}
                                                onClick={() => handleCreateReply(comment.id)}
                                                type="button"
                                            >
                                                {busyCommentId === comment.id ? '저장 중...' : '답글 저장'}
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function resolveMemberMeta(members: TeamMemberSummary[], userId: string) {
    const member = members.find((candidate) => candidate.userId === userId);
    return {
        role: member?.role ?? 'member',
        username: member?.user?.username ?? '알 수 없는 멤버',
    };
}
