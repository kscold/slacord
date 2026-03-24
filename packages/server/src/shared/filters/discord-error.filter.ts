import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DiscordNotifyService } from '../../modules/discord/discord-notify.service';

@Catch()
export class DiscordErrorFilter implements ExceptionFilter {
    private readonly logger = new Logger(DiscordErrorFilter.name);

    constructor(private readonly discord: DiscordNotifyService) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();

        if (!req || !res?.status) return;

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof Error ? exception.message : String(exception);
        const stack = exception instanceof Error ? exception.stack : undefined;

        // 500번대 에러만 디스코드 알림
        if (status >= 500) {
            this.discord.notifyError(req.method, req.originalUrl, status, message, stack).catch(() => {});
            this.logger.error(`${req.method} ${req.originalUrl} ${status} - ${message}`);
        }

        res.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
        });
    }
}
