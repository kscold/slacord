import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import type { IssuePriority, IssueStatus } from '../../../domain/issue.entity';

export class UpdateIssueDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: ['todo', 'in_progress', 'in_review', 'done'] })
    @IsOptional()
    @IsEnum(['todo', 'in_progress', 'in_review', 'done'])
    status?: IssueStatus;

    @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'] })
    @IsOptional()
    @IsEnum(['low', 'medium', 'high', 'urgent'])
    priority?: IssuePriority;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    assigneeIds?: string[];

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    labels?: string[];
}
