import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password' })
    @IsString()
    password: string;

    @ApiPropertyOptional({ example: true, description: '로그인 유지 (30일)' })
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;
}
