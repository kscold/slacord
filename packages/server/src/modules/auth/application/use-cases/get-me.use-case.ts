import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { IUserRepository } from '../../domain/auth.port';
import { USER_REPOSITORY } from '../../domain/auth.port';

@Injectable()
export class GetMeUseCase {
    constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

    async execute(userId: string) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다.');
        }
        return user.toPublic();
    }
}
