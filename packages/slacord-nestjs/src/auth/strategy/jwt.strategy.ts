import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { User, UserDocument } from '../../schema/user.schema';

/**
 * JWT 인증 전략
 * - Bearer 토큰 또는 쿠키에서 JWT 추출
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                // 1. Authorization Bearer 토큰에서 추출
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                // 2. 쿠키에서 추출
                (req: Request) => {
                    let token = null;
                    if (req && req.cookies) {
                        token = req.cookies['accessToken'];
                    }
                    return token;
                },
            ]),
            secretOrKey: configService.get<string>('JWT_SECRET') || 'slacord-secret-key',
        });
    }

    /**
     * JWT 토큰 검증 후 사용자 정보 조회
     * - Passport가 이 메서드의 반환값을 request.user에 할당
     */
    async validate(payload: any) {
        const { sub: userId, email } = payload;
        const user = await this.userModel.findById(userId);

        if (!user || !user.isActive) {
            throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }

        // request.user에 할당될 객체
        return {
            userId: user._id.toString(),
            email: user.email,
            username: user.username,
        };
    }
}
