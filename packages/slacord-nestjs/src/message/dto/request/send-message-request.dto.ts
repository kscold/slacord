import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 메시지 전송 요청 DTO
 */
export class SendMessageRequestDto {
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
     * 메시지 내용
     * @example "안녕하세요, 프로젝트 진행 상황을 공유드립니다."
     */
    @ApiProperty({
        description: '메시지 내용',
        example: '안녕하세요, 프로젝트 진행 상황을 공유드립니다.',
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    /**
     * 발신자 이름 (선택)
     * @example "홍길동"
     */
    @ApiProperty({
        description: '발신자 이름',
        example: '홍길동',
        required: false,
    })
    @IsString()
    @IsOptional()
    username?: string;
}
