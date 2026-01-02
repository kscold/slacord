import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Discord Webhook 서비스
 * - Slack 메시지를 Discord로 백업
 * - Discord를 영구 저장소로 활용 (90일 제한 없음)
 */
@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private webhookUrl: string;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL');
  }

  /**
   * Discord로 메시지 전송 (백업)
   * @param content 메시지 내용
   * @param username 발신자 이름
   * @param avatarUrl 발신자 프로필 이미지
   */
  async sendMessage(
    content: string,
    username?: string,
    avatarUrl?: string,
  ): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn(
        '[sendMessage] Discord Webhook URL이 설정되지 않았습니다.',
      );
      return;
    }

    try {
      const payload = {
        content,
        username: username || 'Slack Archive Bot',
        avatar_url: avatarUrl,
      };

      await axios.post(this.webhookUrl, payload);
      this.logger.log(
        `[sendMessage] Discord 백업 완료: ${content.substring(0, 50)}...`,
      );
    } catch (error) {
      this.logger.error(`[sendMessage] Discord 전송 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 파일 포함 메시지 전송
   * @param content 메시지 내용
   * @param fileUrl 파일 URL
   * @param username 발신자 이름
   */
  async sendMessageWithFile(
    content: string,
    fileUrl: string,
    username?: string,
  ): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn(
        '[sendMessageWithFile] Discord Webhook URL이 설정되지 않았습니다.',
      );
      return;
    }

    try {
      const payload = {
        content: `${content}\n\n📎 파일: ${fileUrl}`,
        username: username || 'Slack Archive Bot',
      };

      await axios.post(this.webhookUrl, payload);
      this.logger.log(
        `[sendMessageWithFile] Discord 파일 백업 완료: ${fileUrl}`,
      );
    } catch (error) {
      this.logger.error(
        `[sendMessageWithFile] Discord 파일 전송 실패: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 임베드 메시지 전송 (구조화된 메시지)
   * @param title 제목
   * @param description 내용
   * @param fields 추가 필드들
   * @param color 색상 (hex)
   */
  async sendEmbed(
    title: string,
    description: string,
    fields?: { name: string; value: string; inline?: boolean }[],
    color?: string,
  ): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn(
        '[sendEmbed] Discord Webhook URL이 설정되지 않았습니다.',
      );
      return;
    }

    try {
      const payload = {
        embeds: [
          {
            title,
            description,
            fields,
            color: color ? parseInt(color.replace('#', ''), 16) : 0x5865f2, // 기본 Discord 파란색
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await axios.post(this.webhookUrl, payload);
      this.logger.log(`[sendEmbed] Discord 임베드 백업 완료: ${title}`);
    } catch (error) {
      this.logger.error(
        `[sendEmbed] Discord 임베드 전송 실패: ${error.message}`,
      );
      throw error;
    }
  }
}
