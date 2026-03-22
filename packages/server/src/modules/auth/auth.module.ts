import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from './infrastructure/persistence/user.schema';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { USER_REPOSITORY } from './domain/auth.port';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { AuthController } from './infrastructure/http/auth.controller';
import { JwtStrategy } from '../../shared/strategy/jwt.strategy';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') ?? 'slacord-secret-key',
                signOptions: { expiresIn: '7d' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        { provide: USER_REPOSITORY, useClass: UserRepository },
        LoginUseCase,
        RegisterUseCase,
        JwtStrategy,
    ],
    exports: [JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
