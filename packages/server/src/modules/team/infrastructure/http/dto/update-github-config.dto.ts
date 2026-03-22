import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateGithubConfigDto {
    @ApiProperty({ example: 'https://github.com/pawpong-team/pawpong_backend' })
    @IsString()
    @MinLength(1)
    repoUrl: string;

    @ApiProperty({ example: 'my-webhook-secret-32chars' })
    @IsString()
    @MinLength(8)
    webhookSecret: string;

    @ApiProperty({ description: '알림받을 채널 ID', example: '507f1f77bcf86cd799439011' })
    @IsString()
    @MinLength(1)
    notifyChannelId: string;
}
