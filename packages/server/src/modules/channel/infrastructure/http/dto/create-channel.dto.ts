import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
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

    @ApiPropertyOptional({ enum: ['public', 'private', 'dm', 'group'], default: 'public' })
    @IsOptional()
    @IsEnum(['public', 'private', 'dm', 'group'])
    type?: ChannelType;

    @ApiPropertyOptional({ type: [String], example: ['67f9e7d4d1498b3ce286b77a'] })
    @IsOptional()
    @IsArray()
    memberIds?: string[];
}
