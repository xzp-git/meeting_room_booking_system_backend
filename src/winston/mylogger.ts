import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { createLogger, Logger } from 'winston';

export class MyLogger implements LoggerService {
  private logger: Logger;
  constructor(options) {
    this.logger = createLogger(options);
  }
  log(message: string, context: string) {
    const time = dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    this.logger.log('info', message, { context, time });
  }
  error(message: string, context: string) {
    const time = dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    this.logger.log('error', message, { context, time });
  }
  warn(message: string, context: string) {
    const time = dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    this.logger.log('warn', message, { context, time });
  }

  debug(message: string, context: string) {
    const time = dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    this.logger.log('debug', message, { context, time });
  }
}
