import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IUserRepository } from "../../domain/auth.port";
import { USER_REPOSITORY } from '../../domain/auth.port';
import { UserEntity } from '../../domain/user.entity';

export interface RegisterInput {
    email: string;
    username: string;
    password: string;
}

/** 회원가입 유스케이스 */
@Injectable()
export class RegisterUseCase {
    constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

    async execute(input: RegisterInput): Promise<UserEntity> {
        const exists = await this.userRepo.existsByEmail(input.email);
        if (exists) {
            throw new BadRequestException('이미 사용 중인 이메일입니다.');
        }

        const passwordHash = await bcrypt.hash(input.password, 10);

        return this.userRepo.save({
            email: input.email,
            username: input.username,
            passwordHash,
            avatarUrl: null,
        });
    }
}
