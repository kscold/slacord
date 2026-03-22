import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'username', minLength: 2 })
    @IsString()
    @MinLength(2)
    username: string;

    @ApiProperty({ example: 'password', minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;
}
