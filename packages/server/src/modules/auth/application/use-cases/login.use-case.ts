import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { IUserRepository } from '../../domain/auth.port';
import { USER_REPOSITORY } from '../../domain/auth.port';

export interface LoginInput {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface LoginOutput {
    accessToken: string;
    user: { id: string; email: string; username: string; avatarUrl: string | null };
}

/** 로그인 유스케이스 */
@Injectable()
export class LoginUseCase {
    constructor(
        @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
        private readonly jwtService: JwtService,
    ) {}

    async execute(input: LoginInput): Promise<LoginOutput> {
        const user = await this.userRepo.findByEmail(input.email);
        if (!user) {
            throw new BadRequestException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }

        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
            throw new BadRequestException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }

        const payload = { sub: user.id, email: user.email, username: user.username };
        const expiresIn = input.rememberMe ? '30d' : '7d';
        const accessToken = this.jwtService.sign(payload, { expiresIn });

        return { accessToken, user: user.toPublic() };
    }
}
