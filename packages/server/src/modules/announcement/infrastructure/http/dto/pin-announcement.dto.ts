import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PinAnnouncementDto {
    @ApiProperty({ example: true })
    @IsBoolean()
    isPinned: boolean;
}
