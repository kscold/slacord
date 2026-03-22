import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateTeamDto {
    @ApiProperty({ example: '포퐁팀', minLength: 2 })
    @IsString()
    @MinLength(2)
    name: string;

    @ApiProperty({ example: 'pawpong', description: '소문자, 숫자, 하이픈만 허용' })
    @IsString()
    @Matches(/^[a-z0-9-]+$/, { message: '슬러그는 소문자, 숫자, 하이픈만 허용됩니다.' })
    slug: string;

    @ApiPropertyOptional({ example: '팀 설명' })
    @IsOptional()
    @IsString()
    description?: string;
}
