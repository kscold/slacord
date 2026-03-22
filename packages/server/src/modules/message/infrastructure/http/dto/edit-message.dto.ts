import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class EditMessageDto {
    @ApiProperty({ example: '수정된 메시지 내용' })
    @IsString()
    @MinLength(1)
    content: string;
}
