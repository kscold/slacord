import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateDocumentCommentDto {
    @ApiProperty({ example: '수정된 코멘트 내용입니다.' })
    @IsString()
    @MinLength(1)
    content: string;
}
