import { BadRequestException } from '@nestjs/common';
import { UserEntity } from '../../../auth/domain/user.entity';
import { TeamEntity } from '../../../team/domain/team.entity';
import { DocumentCommentEntity } from '../../domain/document-comment.entity';
import { DocumentEntity } from '../../domain/document.entity';
import { CreateDocumentCommentUseCase } from './create-document-comment.use-case';

function makeDocument(overrides: Partial<{ id: string; teamId: string; createdBy: string; visibility: 'team' | 'restricted'; allowedViewerIds: string[] }> = {}) {
    return new DocumentEntity(
        overrides.id ?? 'doc-1',
        overrides.teamId ?? 'team-1',
        '문서',
        '<p>content</p>',
        'html',
        null,
        overrides.createdBy ?? 'user-owner',
        overrides.createdBy ?? 'user-owner',
        null,
        null,
        null,
        overrides.visibility ?? 'restricted',
        'all',
        overrides.allowedViewerIds ?? ['user-visible'],
        [],
        null,
        null,
        new Date(),
        new Date(),
    );
}

function makeComment(overrides: Partial<{ id: string; teamId: string; documentId: string; parentId: string | null; createdBy: string; resolvedAt: Date | null }> = {}) {
    return new DocumentCommentEntity(
        overrides.id ?? 'comment-1',
        overrides.teamId ?? 'team-1',
        overrides.documentId ?? 'doc-1',
        overrides.parentId ?? null,
        '코멘트',
        null,
        overrides.createdBy ?? 'user-author',
        overrides.resolvedAt ?? null,
        null,
        null,
        null,
        null,
        new Date(),
        new Date(),
    );
}

function makeUser(id: string, username: string) {
    return new UserEntity(id, `${username}@example.com`, username, 'hash', null, new Date());
}

function makeTeam() {
    return new TeamEntity(
        'team-1',
        '테스트 팀',
        'test-team',
        null,
        null,
        [
            { userId: 'user-owner', role: 'owner', joinedAt: new Date(), canManageInvites: true },
            { userId: 'user-author', role: 'member', joinedAt: new Date(), canManageInvites: false },
            { userId: 'user-visible', role: 'member', joinedAt: new Date(), canManageInvites: false },
            { userId: 'user-hidden', role: 'member', joinedAt: new Date(), canManageInvites: false },
        ],
        [],
        null,
        { slack: { enabled: false, webhookUrl: '', relayAnnouncements: false, relayGithub: false }, discord: { enabled: false, webhookUrl: '', relayAnnouncements: false, relayGithub: false } },
        new Date(),
    );
}

describe('CreateDocumentCommentUseCase', () => {
    const mockCommentRepo = {
        findByDocument: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        updateContent: jest.fn(),
        updateStatus: jest.fn(),
        softDelete: jest.fn(),
    };
    const mockDocumentRepo = {
        findByTeam: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        upsertExternal: jest.fn(),
        update: jest.fn(),
        archiveById: jest.fn(),
        restoreById: jest.fn(),
        archiveByParentId: jest.fn(),
        deleteById: jest.fn(),
    };
    const mockTeamRepo = {
        findById: jest.fn(),
        findBySlug: jest.fn(),
        findByInviteCode: jest.fn(),
        findByGithubRepo: jest.fn(),
        findByMember: jest.fn(),
        save: jest.fn(),
        addMember: jest.fn(),
        replaceAccess: jest.fn(),
        existsBySlug: jest.fn(),
        updateGithubConfig: jest.fn(),
        updateBridgeConfig: jest.fn(),
        appendAuditLog: jest.fn(),
    };
    const mockUserRepo = {
        findById: jest.fn(),
        findByIds: jest.fn(),
        findByEmail: jest.fn(),
        save: jest.fn(),
        existsByEmail: jest.fn(),
    };
    const mockNotification = {
        execute: jest.fn(),
        executeBulk: jest.fn(),
    };

    let useCase: CreateDocumentCommentUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserRepo.findByIds.mockImplementation(async (ids: string[]) => {
            const users = [
                makeUser('user-owner', 'owner'),
                makeUser('user-author', 'author'),
                makeUser('user-visible', 'visible'),
                makeUser('user-hidden', 'hidden'),
            ];
            return users.filter((user) => ids.includes(user.id));
        });
        useCase = new CreateDocumentCommentUseCase(
            mockCommentRepo as any,
            mockDocumentRepo as any,
            mockTeamRepo as any,
            mockUserRepo as any,
            mockNotification as any,
        );
    });

    it('문서 접근 가능한 멤버만 멘션 알림을 받는다', async () => {
        const document = makeDocument();
        const savedComment = makeComment({ createdBy: 'user-author' });

        mockDocumentRepo.findById.mockResolvedValue(document);
        mockCommentRepo.save.mockResolvedValue(savedComment);
        mockTeamRepo.findById.mockResolvedValue(makeTeam());
        mockUserRepo.findById.mockResolvedValue(makeUser('user-author', 'author'));

        const result = await useCase.execute({
            teamId: 'team-1',
            documentId: 'doc-1',
            content: '검토 부탁해요 @visible @hidden @owner @author',
            createdBy: 'user-author',
        });

        expect(result).toBe(savedComment);
        expect(mockNotification.executeBulk).toHaveBeenCalledWith([
            expect.objectContaining({ recipientId: 'user-visible', resourceType: 'document', resourceId: 'doc-1' }),
            expect.objectContaining({ recipientId: 'user-owner', resourceType: 'document', resourceId: 'doc-1' }),
        ]);
    });

    it('답글은 부모 작성자에게 문서 스레드 알림을 보낸다', async () => {
        const document = makeDocument({ visibility: 'team' });
        const parentComment = makeComment({ id: 'comment-parent', createdBy: 'user-owner' });
        const replyComment = makeComment({ id: 'comment-reply', parentId: 'comment-parent', createdBy: 'user-author' });

        mockDocumentRepo.findById.mockResolvedValue(document);
        mockCommentRepo.findById.mockResolvedValue(parentComment);
        mockCommentRepo.save.mockResolvedValue(replyComment);
        mockTeamRepo.findById.mockResolvedValue(makeTeam());
        mockUserRepo.findById.mockResolvedValue(makeUser('user-author', 'author'));

        await useCase.execute({
            teamId: 'team-1',
            documentId: 'doc-1',
            parentId: 'comment-parent',
            content: '답글입니다.',
            createdBy: 'user-author',
        });

        expect(mockNotification.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                recipientId: 'user-owner',
                type: 'thread_reply',
                resourceType: 'document',
                resourceId: 'doc-1',
            }),
        );
    });

    it('다른 문서 코멘트에 답글을 달면 실패한다', async () => {
        mockDocumentRepo.findById.mockResolvedValue(makeDocument());
        mockCommentRepo.findById.mockResolvedValue(makeComment({ documentId: 'doc-2' }));

        await expect(
            useCase.execute({
                teamId: 'team-1',
                documentId: 'doc-1',
                parentId: 'comment-parent',
                content: '답글',
                createdBy: 'user-author',
            }),
        ).rejects.toThrow(BadRequestException);
    });
});
