import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';

class UpdateBridgeTargetConfigDto {
    @ApiProperty({ example: true })
    @IsBoolean()
    enabled: boolean;

    @ApiProperty({ example: 'https://hooks.slack.com/services/T123/B456/bridgehook' })
    @IsString()
    webhookUrl: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    relayAnnouncements: boolean;

    @ApiProperty({ example: true })
    @IsBoolean()
    relayGithub: boolean;
}

export class UpdateBridgeConfigDto {
    @ApiProperty({ type: UpdateBridgeTargetConfigDto })
    @ValidateNested()
    @Type(() => UpdateBridgeTargetConfigDto)
    slack: UpdateBridgeTargetConfigDto;

    @ApiProperty({ type: UpdateBridgeTargetConfigDto })
    @ValidateNested()
    @Type(() => UpdateBridgeTargetConfigDto)
    discord: UpdateBridgeTargetConfigDto;
}
