import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateDocumentCommentStatusDto {
    @ApiProperty({ example: true })
    @IsBoolean()
    resolved: boolean;
}
