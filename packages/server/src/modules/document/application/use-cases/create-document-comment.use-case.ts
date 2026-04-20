import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { USER_REPOSITORY, type IUserRepository } from '../../../auth/domain/auth.port';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';
import type { DocumentCommentEntity } from '../../domain/document-comment.entity';
import { DOCUMENT_COMMENT_REPOSITORY, type IDocumentCommentRepository } from '../../domain/document-comment.port';
import { DOCUMENT_REPOSITORY, type IDocumentRepository } from '../../domain/document.port';
import {
    NOTIFICATION_EVENTS,
    type MentionedEvent,
    type ThreadRepliedEvent,
} from '../../../../shared/events/notification-events';
import { extractMentionTokens, resolveMentionUserIds } from '../../../../shared/lib/mention-extraction';

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
        private readonly eventEmitter: EventEmitter2,
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
        const mentionRecipientIds = await this.findMentionedUserIds(document.teamId, document.id, input.createdBy, content);

        if (mentionRecipientIds.length > 0) {
            const event: MentionedEvent = {
                teamId: input.teamId,
                recipientIds: mentionRecipientIds,
                actorId: input.createdBy,
                actorName,
                content,
                resourceType: 'document',
                resourceId: input.documentId,
            };
            this.eventEmitter.emit(NOTIFICATION_EVENTS.MENTIONED, event);
        }

        if (parentComment && parentComment.createdBy !== input.createdBy && !mentionRecipientIds.includes(parentComment.createdBy)) {
            const event: ThreadRepliedEvent = {
                teamId: input.teamId,
                recipientId: parentComment.createdBy,
                actorId: input.createdBy,
                actorName,
                content,
                resourceType: 'document',
                resourceId: input.documentId,
            };
            this.eventEmitter.emit(NOTIFICATION_EVENTS.THREAD_REPLIED, event);
        }

        return comment;
    }

    private async findMentionedUserIds(teamId: string, documentId: string, authorId: string, content: string) {
        const tokens = extractMentionTokens(content);
        if (tokens.length === 0) return [];

        const team = await this.teamRepo.findById(teamId);
        const document = await this.documentRepo.findById(documentId);
        if (!team || !document) return [];

        const viewableMembers = team.members.filter((member) => document.canView(member.userId, member.role));
        const users = await this.userRepo.findByIds(viewableMembers.map((member) => member.userId));
        return resolveMentionUserIds(
            tokens,
            users.map((u) => ({ userId: u.id, username: u.username })),
            authorId,
        );
    }
}

function sanitizeAnchorText(anchorText?: string | null) {
    const value = anchorText?.trim();
    return value ? value.slice(0, 280) : null;
}
