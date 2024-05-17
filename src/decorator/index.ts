import {
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';
import { REQUIRE_LOGIN } from 'src/utils';

export const RequireLogin = () => SetMetadata(REQUIRE_LOGIN, true);

export const RequirePermission = (permissions: string[]) =>
  SetMetadata('REQUIRE_PERMISSION', permissions);

export const UserInfo = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request.userInfo) {
      return null;
    }
    return key ? request.userInfo[key] : request.userInfo;
  },
);
