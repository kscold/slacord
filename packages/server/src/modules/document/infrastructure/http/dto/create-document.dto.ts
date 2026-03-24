import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDocumentDto {
    @ApiProperty({ example: '온보딩 가이드' })
    @IsString()
    @MinLength(1)
    title: string;

    @ApiPropertyOptional({ example: '# 온보딩\n\n환영합니다!' })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({ description: '부모 문서 ID (트리 구조)', example: null })
    @IsOptional()
    @IsString()
    parentId?: string | null;

    @ApiPropertyOptional({ example: 'plain', enum: ['plain', 'html'] })
    @IsOptional()
    @IsString()
    contentFormat?: 'plain' | 'html';
}
