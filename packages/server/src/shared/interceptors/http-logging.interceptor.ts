import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { catchError, tap, throwError } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler) {
        if (context.getType() !== 'http') {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startedAt = Date.now();
        const path = request.originalUrl ?? request.url;
        return next.handle().pipe(
            tap(() => this.logger.log(`${request.method} ${path} ${response.statusCode} ${Date.now() - startedAt}ms`)),
            catchError((error) => {
                const status = error?.status ?? 500;
                this.logger.error(`${request.method} ${path} ${status} ${Date.now() - startedAt}ms`);
                return throwError(() => error);
            }),
        );
    }
}
