import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UploadMessageAttachmentDto {
    @ApiProperty({ example: '67f9e7d4d1498b3ce286b77a' })
    @IsString()
    @MinLength(1)
    teamId: string;
}
