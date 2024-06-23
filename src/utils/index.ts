import { BadRequestException, ParseIntPipe } from '@nestjs/common';

export { hashPassword } from './hash';
export * from './constants';

export function generateParseIntPipe(name) {
  return new ParseIntPipe({
    exceptionFactory() {
      throw new BadRequestException(name + ' 应该传数字');
    },
  });
}
