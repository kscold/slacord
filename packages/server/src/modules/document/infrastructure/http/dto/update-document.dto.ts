import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

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

    @ApiPropertyOptional({ example: 'plain', enum: ['plain', 'html', 'json'] })
    @IsOptional()
    @IsString()
    contentFormat?: 'plain' | 'html' | 'json';

    @ApiPropertyOptional({ enum: ['team', 'restricted'] })
    @IsOptional()
    @IsIn(['team', 'restricted'])
    visibility?: 'team' | 'restricted';

    @ApiPropertyOptional({ enum: ['owner_admin', 'all', 'restricted'] })
    @IsOptional()
    @IsIn(['owner_admin', 'all', 'restricted'])
    editPolicy?: 'owner_admin' | 'all' | 'restricted';

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    allowedViewerIds?: string[];

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    allowedEditorIds?: string[];
}
