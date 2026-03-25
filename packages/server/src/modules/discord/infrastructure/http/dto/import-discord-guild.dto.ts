import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class ImportDiscordGuildDto {
    @ApiProperty({ description: 'Discord Bot Token', example: 'MTIz...abcdef' })
    @IsString()
    @MinLength(20)
    botToken: string;

    @ApiProperty({ description: 'Discord Guild ID', example: '1409466404759142524' })
    @IsString()
    @MinLength(5)
    guildId: string;

    @ApiPropertyOptional({ description: '특정 채널만 가져올 때 Discord Channel ID 목록', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    channelIds?: string[];
}
