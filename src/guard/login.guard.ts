import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Permission } from 'src/user';
import { REQUIRE_LOGIN } from 'src/utils';

interface JwtUserData {
  userId: number;
  username: string;
  roles: string[];
  permissions: Permission[];
}

declare module 'express' {
  interface Request {
    userInfo: JwtUserData;
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  @Inject(Reflector)
  private readonly reflector: Reflector;

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const httpRequest = context.switchToHttp().getRequest();
    const requireLogin = this.reflector.getAllAndOverride(REQUIRE_LOGIN, [
      context.getClass(),
      context.getHandler(),
    ]);
    if (!requireLogin) {
      return true;
    }

    const { authorization } = httpRequest.headers;

    if (!authorization) {
      throw new UnauthorizedException('用户未登录');
    }

    try {
      const [, token] = authorization.split(' ');

      const data = this.jwtService.verify<JwtUserData>(token);
      httpRequest.userInfo = data;
      return true;
    } catch (error) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }
}
