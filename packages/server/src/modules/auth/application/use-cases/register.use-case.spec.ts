import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterUseCase } from './register.use-case';
import { UserEntity } from '../../domain/user.entity';

const mockUser = new UserEntity('user-1', 'test@example.com', '테스트', 'hashed', null, new Date());

const mockRepo = {
    existsByEmail: jest.fn(),
    save: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
};

const mockDiscord = {
    notifySignup: jest.fn().mockResolvedValue(undefined),
    notifyError: jest.fn().mockResolvedValue(undefined),
};

describe('RegisterUseCase', () => {
    let useCase: RegisterUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new RegisterUseCase(mockRepo as any, mockDiscord as any);
    });

    it('정상 가입', async () => {
        mockRepo.existsByEmail.mockResolvedValue(false);
        mockRepo.save.mockResolvedValue(mockUser);

        const result = await useCase.execute({ email: 'test@example.com', username: '테스트', password: 'password123' });

        expect(result.email).toBe('test@example.com');
        expect(mockRepo.existsByEmail).toHaveBeenCalledWith('test@example.com');
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('중복 이메일이면 400', async () => {
        mockRepo.existsByEmail.mockResolvedValue(true);

        await expect(useCase.execute({ email: 'dup@example.com', username: '테스트', password: 'password123' }))
            .rejects.toThrow(BadRequestException);
    });

    it('비밀번호가 해싱되어 저장됨', async () => {
        mockRepo.existsByEmail.mockResolvedValue(false);
        mockRepo.save.mockImplementation(async (data: { passwordHash: string }) => {
            const isHashed = await bcrypt.compare('password123', data.passwordHash);
            expect(isHashed).toBe(true);
            return mockUser;
        });

        await useCase.execute({ email: 'test@example.com', username: '테스트', password: 'password123' });
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('디스코드 알림 실패해도 가입은 성공', async () => {
        mockRepo.existsByEmail.mockResolvedValue(false);
        mockRepo.save.mockResolvedValue(mockUser);
        mockDiscord.notifySignup.mockRejectedValue(new Error('discord down'));

        const result = await useCase.execute({ email: 'test@example.com', username: '테스트', password: 'password123' });
        expect(result.email).toBe('test@example.com');
    });
});
