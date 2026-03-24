import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

@Injectable()
export class DiscordNotifyService {
    private readonly logger = new Logger(DiscordNotifyService.name);
    private readonly botToken: string;
    private readonly signupChannelId: string;
    private readonly errorChannelId: string;

    constructor(private readonly config: ConfigService) {
        this.botToken = config.get<string>('DISCORD_BOT_TOKEN', '');
        this.signupChannelId = config.get<string>('DISCORD_SIGNUP_CHANNEL_ID', '');
        this.errorChannelId = config.get<string>('DISCORD_ERROR_CHANNEL_ID', '');
    }

    /** 회원가입 알림 */
    async notifySignup(email: string, username: string) {
        if (!this.signupChannelId) return;

        await this.sendEmbed(this.signupChannelId, {
            title: '새 회원가입',
            color: 0x2ecc71,
            fields: [
                { name: '이름', value: username, inline: true },
                { name: '이메일', value: email, inline: true },
            ],
            timestamp: new Date().toISOString(),
        });
    }

    /** API 에러 알림 (500번대) */
    async notifyError(method: string, path: string, status: number, message: string, stack?: string) {
        if (!this.errorChannelId) return;

        const fields: EmbedField[] = [
            { name: 'Method', value: method, inline: true },
            { name: 'Path', value: path, inline: true },
            { name: 'Status', value: String(status), inline: true },
            { name: 'Message', value: message.slice(0, 1024) },
        ];

        if (stack) {
            fields.push({ name: 'Stack', value: `\`\`\`\n${stack.slice(0, 900)}\n\`\`\`` });
        }

        await this.sendEmbed(this.errorChannelId, {
            title: `API Error ${status}`,
            color: 0xe74c3c,
            fields,
            timestamp: new Date().toISOString(),
        });
    }

    private async sendEmbed(channelId: string, embed: Record<string, unknown>) {
        if (!this.botToken) return;

        try {
            const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${this.botToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ embeds: [embed] }),
            });

            if (!res.ok) {
                this.logger.warn(`Discord API ${res.status}: ${await res.text()}`);
            }
        } catch (err) {
            this.logger.warn(`Discord notify failed: ${err}`);
        }
    }
}
