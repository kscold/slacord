import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/user.schema';

/**
 * JWT 인증 전략
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>('JWT_SECRET') || 'slacord-secret-key',
        });
    }

    /**
     * JWT 토큰 검증 후 사용자 정보 조회
     */
    async validate(payload: any): Promise<UserDocument> {
        const { sub: userId } = payload;
        const user = await this.userModel.findById(userId);

        if (!user || !user.isActive) {
            throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }

        return user;
    }
}
