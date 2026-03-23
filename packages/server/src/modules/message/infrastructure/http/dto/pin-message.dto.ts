import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PinMessageDto {
    @ApiProperty({ example: true })
    @IsBoolean()
    isPinned: boolean;
}
