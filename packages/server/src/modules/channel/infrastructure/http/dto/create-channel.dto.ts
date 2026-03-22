import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import type { ChannelType } from '../../../domain/channel.entity';

export class CreateChannelDto {
    @ApiProperty({ example: '일반' })
    @IsString()
    @MinLength(1)
    name: string;

    @ApiPropertyOptional({ example: '채널 설명' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: ['public', 'private'], default: 'public' })
    @IsOptional()
    @IsEnum(['public', 'private'])
    type?: ChannelType;
}
