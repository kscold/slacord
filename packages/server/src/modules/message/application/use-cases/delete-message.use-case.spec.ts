import { BadRequestException } from '@nestjs/common';
import { DeleteMessageUseCase } from './delete-message.use-case';

describe('DeleteMessageUseCase', () => {
    const mockMessageRepo = {
        findById: jest.fn(),
        deleteById: jest.fn(),
    };

    const mockTeamRepo = {
        findById: jest.fn(),
    };

    let useCase: DeleteMessageUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new DeleteMessageUseCase(mockMessageRepo as any, mockTeamRepo as any);
    });

    it('팀 admin은 다른 멤버 메시지를 삭제할 수 있다', async () => {
        mockMessageRepo.findById.mockResolvedValue({ id: 'message-1', authorId: 'user-author', teamId: 'team-1' });
        mockTeamRepo.findById.mockResolvedValue({ hasAdminAccess: (userId: string) => userId === 'user-admin' });
        mockMessageRepo.deleteById.mockResolvedValue(true);

        await useCase.execute('message-1', 'user-admin');

        expect(mockTeamRepo.findById).toHaveBeenCalledWith('team-1');
        expect(mockMessageRepo.deleteById).toHaveBeenCalledWith('message-1');
    });

    it('팀 관리자가 아니면 다른 사람 메시지를 삭제할 수 없다', async () => {
        mockMessageRepo.findById.mockResolvedValue({ id: 'message-1', authorId: 'user-author', teamId: 'team-1' });
        mockTeamRepo.findById.mockResolvedValue({ hasAdminAccess: () => false });

        await expect(useCase.execute('message-1', 'user-member')).rejects.toBeInstanceOf(BadRequestException);
        expect(mockMessageRepo.deleteById).not.toHaveBeenCalled();
    });
});
