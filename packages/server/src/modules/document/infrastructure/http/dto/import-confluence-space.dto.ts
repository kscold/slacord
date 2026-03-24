import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ImportConfluenceSpaceDto {
    @ApiProperty({ example: 'https://breedermatch.atlassian.net' })
    @IsString()
    @MinLength(1)
    siteUrl: string;

    @ApiProperty({ example: 'team@example.com' })
    @IsString()
    @MinLength(1)
    email: string;

    @ApiProperty({ example: 'ATATT...' })
    @IsString()
    @MinLength(1)
    apiToken: string;

    @ApiProperty({ example: 'BREEDER' })
    @IsString()
    @MinLength(1)
    spaceKey: string;

    @ApiPropertyOptional({ example: '123456' })
    @IsOptional()
    @IsString()
    rootPageId?: string;
}
