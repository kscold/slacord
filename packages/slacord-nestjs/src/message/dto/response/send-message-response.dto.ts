import { ApiProperty } from '@nestjs/swagger';

/**
 * 메시지 전송 응답 DTO
 */
export class SendMessageResponseDto {
    /**
     * 전송 성공 여부
     * @example true
     */
    @ApiProperty({
        description: '전송 성공 여부',
        example: true,
    })
    success: boolean;

    /**
     * Slack 메시지 타임스탬프 (Slack 메시지 고유 ID)
     * @example "1704067200.123456"
     */
    @ApiProperty({
        description: 'Slack 메시지 타임스탬프',
        example: '1704067200.123456',
    })
    messageTs: string;

    /**
     * Slack 채널 ID
     * @example "C06ABCD1234"
     */
    @ApiProperty({
        description: 'Slack 채널 ID',
        example: 'C06ABCD1234',
    })
    channelId: string;

    /**
     * 전송 시각
     * @example "2025-01-01T12:00:00.000Z"
     */
    @ApiProperty({
        description: '전송 시각',
        example: '2025-01-01T12:00:00.000Z',
    })
    timestamp: string;
}
