import { ApiProperty } from '@nestjs/swagger';

/**
 * 개별 메시지 DTO
 */
export class MessageDto {
    /**
     * 메시지 ID (Slack ts 또는 Discord message ID)
     * @example "1704067200.123456"
     */
    @ApiProperty({
        description: '메시지 ID',
        example: '1704067200.123456',
    })
    messageId: string;

    /**
     * 메시지 내용
     * @example "프로젝트 진행 상황을 공유드립니다."
     */
    @ApiProperty({
        description: '메시지 내용',
        example: '프로젝트 진행 상황을 공유드립니다.',
    })
    content: string;

    /**
     * 발신자 이름
     * @example "홍길동"
     */
    @ApiProperty({
        description: '발신자 이름',
        example: '홍길동',
    })
    username: string;

    /**
     * 메시지 전송 시각
     * @example "2025-01-01T12:00:00.000Z"
     */
    @ApiProperty({
        description: '메시지 전송 시각',
        example: '2025-01-01T12:00:00.000Z',
    })
    timestamp: string;

    /**
     * 메시지 출처 (slack 또는 discord)
     * @example "slack"
     */
    @ApiProperty({
        description: '메시지 출처',
        example: 'slack',
        enum: ['slack', 'discord'],
    })
    source: 'slack' | 'discord';
}

/**
 * 메시지 조회 응답 DTO
 */
export class GetMessagesResponseDto {
    /**
     * 메시지 목록
     */
    @ApiProperty({
        description: '메시지 목록',
        type: [MessageDto],
    })
    messages: MessageDto[];

    /**
     * 다음 페이지 존재 여부
     * @example true
     */
    @ApiProperty({
        description: '다음 페이지 존재 여부',
        example: true,
    })
    hasMore: boolean;

    /**
     * 다음 페이지 커서 (Slack ts 또는 Discord message ID)
     * @example "1704067200.123456"
     */
    @ApiProperty({
        description: '다음 페이지 커서',
        example: '1704067200.123456',
        required: false,
    })
    nextCursor?: string;
}
