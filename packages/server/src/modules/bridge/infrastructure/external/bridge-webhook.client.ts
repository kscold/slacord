import { BadGatewayException, Injectable } from '@nestjs/common';
import type { BridgeJobEntity } from '../../domain/bridge-job.entity';

@Injectable()
export class BridgeWebhookClient {
    async deliver(job: BridgeJobEntity) {
        const response = await fetch(job.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(job.platform === 'slack' ? this.buildSlackPayload(job) : this.buildDiscordPayload(job)),
        });

        if (!response.ok) {
            throw new BadGatewayException(`외부 브리지 전송 실패 (${response.status})`);
        }
    }

    private buildSlackPayload(job: BridgeJobEntity) {
        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: truncate(job.title, 120),
                },
            },
            job.content
                ? {
                      type: 'section',
                      text: {
                          type: 'mrkdwn',
                          text: truncate(job.content, 2800),
                      },
                  }
                : null,
            job.url
                ? {
                      type: 'section',
                      text: {
                          type: 'mrkdwn',
                          text: `<${job.url}|원본 열기>`,
                      },
                  }
                : null,
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: job.eventType === 'announcement' ? 'Slacord announcement relay' : 'Slacord GitHub relay',
                    },
                ],
            },
        ].filter(Boolean);

        return {
            text: [job.title, job.content, job.url].filter(Boolean).join('\n'),
            blocks,
        };
    }

    private buildDiscordPayload(job: BridgeJobEntity) {
        return {
            content: job.url ? `원본: ${job.url}` : undefined,
            embeds: [
                {
                    title: truncate(job.title, 256),
                    description: job.content ? truncate(job.content, 3500) : undefined,
                    url: job.url ?? undefined,
                    color: job.eventType === 'announcement' ? 0xf59e0b : 0x22c55e,
                    footer: {
                        text: job.eventType === 'announcement' ? 'Slacord announcement relay' : 'Slacord GitHub relay',
                    },
                },
            ],
        };
    }
}

function truncate(value: string, maxLength: number) {
    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
