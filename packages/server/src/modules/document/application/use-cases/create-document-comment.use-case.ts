import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, type IUserRepository } from '../../../auth/domain/auth.port';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';
import type { DocumentCommentEntity } from '../../domain/document-comment.entity';
import { DOCUMENT_COMMENT_REPOSITORY, type IDocumentCommentRepository } from '../../domain/document-comment.port';
import { DOCUMENT_REPOSITORY, type IDocumentRepository } from '../../domain/document.port';

interface CreateDocumentCommentInput {
    teamId: string;
    documentId: string;
    parentId?: string | null;
    content: string;
    anchorText?: string | null;
    createdBy: string;
}

@Injectable()
export class CreateDocumentCommentUseCase {
    constructor(
        @Inject(DOCUMENT_COMMENT_REPOSITORY)
        private readonly commentRepo: IDocumentCommentRepository,
        @Inject(DOCUMENT_REPOSITORY)
        private readonly documentRepo: IDocumentRepository,
        @Inject(TEAM_REPOSITORY)
        private readonly teamRepo: ITeamRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepo: IUserRepository,
        private readonly createNotification: CreateNotificationUseCase,
    ) {}

    async execute(input: CreateDocumentCommentInput) {
        const content = input.content.trim();
        if (!content) throw new BadRequestException('코멘트 내용을 입력해 주세요.');

        const document = await this.documentRepo.findById(input.documentId);
        if (!document || document.teamId !== input.teamId) {
            throw new BadRequestException('존재하지 않는 문서입니다.');
        }

        let parentComment: DocumentCommentEntity | null = null;
        if (input.parentId) {
            parentComment = await this.commentRepo.findById(input.parentId);
            if (!parentComment || parentComment.documentId !== input.documentId || parentComment.teamId !== input.teamId) {
                throw new BadRequestException('답글 대상 코멘트를 찾을 수 없습니다.');
            }
        }

        const comment = await this.commentRepo.save({
            teamId: input.teamId,
            documentId: input.documentId,
            parentId: input.parentId ?? null,
            content,
            anchorText: sanitizeAnchorText(input.anchorText),
            createdBy: input.createdBy,
        });

        const author = await this.userRepo.findById(input.createdBy);
        const actorName = author?.username ?? '알 수 없음';
        const mentionRecipientIds = await this.resolveMentionUserIds(document.teamId, document.id, input.createdBy, content);

        if (mentionRecipientIds.length > 0) {
            void this.createNotification.executeBulk(
                mentionRecipientIds.map((recipientId) => ({
                    teamId: input.teamId,
                    recipientId,
                    type: 'mention',
                    actorId: input.createdBy,
                    actorName,
                    content: content.slice(0, 160) || '새 문서 코멘트 멘션',
                    resourceType: 'document',
                    resourceId: input.documentId,
                })),
            );
        }

        if (parentComment && parentComment.createdBy !== input.createdBy && !mentionRecipientIds.includes(parentComment.createdBy)) {
            void this.createNotification.execute({
                teamId: input.teamId,
                recipientId: parentComment.createdBy,
                type: 'thread_reply',
                actorId: input.createdBy,
                actorName,
                content: content.slice(0, 160) || '문서 코멘트 답글',
                resourceType: 'document',
                resourceId: input.documentId,
            });
        }

        return comment;
    }

    private async resolveMentionUserIds(teamId: string, documentId: string, authorId: string, content: string) {
        const mentionTokens = extractMentionTokens(content);
        if (mentionTokens.length === 0) return [];

        const team = await this.teamRepo.findById(teamId);
        const document = await this.documentRepo.findById(documentId);
        if (!team || !document) return [];

        const members = team.members.filter((member) => document.canView(member.userId, member.role));
        const users = await this.userRepo.findByIds(members.map((member) => member.userId));
        const userIdByUsername = new Map(users.map((user) => [user.username.toLowerCase(), user.id]));

        return [
            ...new Set(
                mentionTokens
                    .map((token) => userIdByUsername.get(token))
                    .filter((userId): userId is string => Boolean(userId) && userId !== authorId),
            ),
        ];
    }
}

function sanitizeAnchorText(anchorText?: string | null) {
    const value = anchorText?.trim();
    return value ? value.slice(0, 280) : null;
}

function extractMentionTokens(content: string) {
    const mentionPattern = /@([^\s@]+)/g;
    const tokens: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionPattern.exec(content)) !== null) {
        tokens.push(match[1].replace(/[.,!?;:]+$/g, '').toLowerCase());
    }
    return tokens;
}
