import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { MyLogger } from 'src/winston/mylogger';
import { WINSTON_LOGGER_TOKEN } from 'src/winston/winston.module';

@Injectable()
export class InvokeRecordInterceptor implements NestInterceptor {
  @Inject(WINSTON_LOGGER_TOKEN)
  private readonly logger: MyLogger;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const userAgent = request.headers['user-agent'];
    const { ip, method, path } = request;

    this.logger.debug(
      `user: ${request.userInfo?.userId}, ${request.userInfo?.username}`,
      `${method} ${path} ${ip} ${userAgent}: ${context.getClass().name} ${
        context.getHandler().name
      } invoked...`,
    );
    const now = Date.now();
    return next.handle().pipe(
      tap((response) => {
        this.logger.debug(
          `${method} ${path} ${ip} ${userAgent}: ${response.code}: ${
            Date.now() - now
          }ms`,
          `Response: ${JSON.stringify(response)}`,
        );
      }),
    );
  }
}
