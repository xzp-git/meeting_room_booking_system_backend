import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { REQUIRE_PERMISSION } from 'src/utils';

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject()
  private readonly reflector: Reflector;
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const { userInfo } = context.switchToHttp().getRequest();

    if (!userInfo) {
      return true;
    }

    const needPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSION,
      [context.getHandler(), context.getClass()],
    );
    if (!needPermissions?.length) {
      return true;
    }

    const hasPermission = needPermissions?.every((permissionKey) =>
      userInfo.permissions.find((item) => item.permissionKey === permissionKey),
    );

    if (!hasPermission) {
      throw new UnauthorizedException('您没有访问该接口的权限');
    }

    return true;
  }
}
