import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDocumentCommentDto {
    @ApiProperty({ example: '이 문단 기준으로 다음 액션을 정리해 주세요.' })
    @IsString()
    @MinLength(1)
    content: string;

    @ApiPropertyOptional({ example: '선택한 문장 일부' })
    @IsOptional()
    @IsString()
    anchorText?: string;

    @ApiPropertyOptional({ example: 'comment-id' })
    @IsOptional()
    @IsString()
    parentId?: string;
}
