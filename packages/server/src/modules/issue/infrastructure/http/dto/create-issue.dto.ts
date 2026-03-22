import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import type { IssuePriority } from '../../../domain/issue.entity';

export class CreateIssueDto {
    @ApiProperty({ example: '로그인 버튼 클릭 시 500 에러 발생' })
    @IsString()
    @MinLength(1)
    title: string;

    @ApiPropertyOptional({ example: '재현 방법: ...' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' })
    @IsOptional()
    @IsEnum(['low', 'medium', 'high', 'urgent'])
    priority?: IssuePriority;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    assigneeIds?: string[];

    @ApiPropertyOptional({ type: [String], example: ['bug', 'backend'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    labels?: string[];
}
