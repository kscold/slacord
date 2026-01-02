import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../user/user.schema';

/**
 * 인증 서비스
 */
@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
    ) {}

    /**
     * 회원가입
     */
    async register(email: string, password: string, username: string): Promise<{ accessToken: string; user: any }> {
        // 이메일 중복 확인
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
            throw new ConflictException('이미 사용 중인 이메일입니다.');
        }

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 생성
        const user = await this.userModel.create({
            email,
            password: hashedPassword,
            username,
        });

        // JWT 토큰 생성
        const payload = { sub: user._id, email: user.email };
        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            },
        };
    }

    /**
     * 로그인
     */
    async login(email: string, password: string): Promise<{ accessToken: string; user: any }> {
        // 사용자 조회
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }

        // 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }

        // 마지막 로그인 시간 업데이트
        await this.userModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

        // JWT 토큰 생성
        const payload = { sub: user._id, email: user.email };
        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            },
        };
    }

    /**
     * 토큰 검증
     */
    async validateToken(token: string): Promise<UserDocument> {
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.userModel.findById(payload.sub);
            if (!user || !user.isActive) {
                throw new UnauthorizedException('유효하지 않은 토큰입니다.');
            }
            return user;
        } catch (error) {
            throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }
    }
}
