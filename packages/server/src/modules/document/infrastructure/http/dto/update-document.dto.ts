import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateDocumentDto {
    @ApiPropertyOptional({ example: '온보딩 가이드 v2' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    title?: string;

    @ApiPropertyOptional({ example: '# 온보딩\n\n업데이트된 내용입니다.' })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({ example: 'plain', enum: ['plain', 'html'] })
    @IsOptional()
    @IsString()
    contentFormat?: 'plain' | 'html';
}
