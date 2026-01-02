import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 메시지 조회 요청 DTO
 */
export class GetMessagesRequestDto {
    /**
     * 팀 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '팀 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @IsString()
    @IsNotEmpty()
    teamId: string;

    /**
     * 조회 시작 날짜 (이 날짜 이전 메시지 조회, ISO 8601 형식)
     * @example "2025-01-01T00:00:00.000Z"
     */
    @ApiProperty({
        description: '조회 시작 날짜 (이 날짜 이전 메시지 조회)',
        example: '2025-01-01T00:00:00.000Z',
        required: false,
    })
    @IsDateString()
    @IsOptional()
    before?: string;

    /**
     * 조회할 메시지 개수 (기본 50, 최대 100)
     * @example 50
     */
    @ApiProperty({
        description: '조회할 메시지 개수',
        example: 50,
        default: 50,
        minimum: 1,
        maximum: 100,
        required: false,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number = 50;
}
