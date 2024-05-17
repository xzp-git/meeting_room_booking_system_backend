import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission, Role, User } from './entities';
import {
  LoginUserDto,
  RegisterUserDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
} from './dto';
import { RedisService } from 'src/redis/redis.service';
import { hashPassword } from 'src/utils';
import { LoginUserVo, UserInfo } from './vo/login-user.vo';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WINSTON_LOGGER_TOKEN } from 'src/winston/winston.module';
import { MyLogger } from 'src/winston/mylogger';

@Injectable()
export class UserService {
  @InjectRepository(User)
  private userRepository: Repository<User>;

  @InjectRepository(Role)
  private roleRepository: Repository<Role>;

  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  @Inject(WINSTON_LOGGER_TOKEN)
  private readonly logger: MyLogger;

  async findUserByCondition(condition: Partial<User>) {
    const user = await this.userRepository.findOne({
      where: {
        ...condition,
      },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    const permissions = user.roles.reduce((arr, item) => {
      item.permissions.forEach((permission) => {
        if (!arr.includes(permission)) {
          arr.push(permission);
        }
      });
      return arr;
    }, []);

    const userInfo = {
      ...user,
      roles: user.roles.map((item) => item.name),
      permissions,
    };
    return userInfo;
  }

  async findUserById(condition: Partial<User>) {
    const user = await this.userRepository.findOne({
      where: {
        ...condition,
      },
    });
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`);
    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }
    if (captcha !== user.captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }
    const foundUser = await this.userRepository.findOneBy({
      email: user.email,
    });
    if (foundUser) {
      throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST);
    }
    const newUser = new User({
      username: user.username,
      password: user.password,
      nickName: user.nickName,
      email: user.email,
    });
    try {
      await this.userRepository.save(newUser);
      return '注册成功';
    } catch (error) {
      return '注册失败';
    }
  }

  async login(loginUser: LoginUserDto) {
    const userInfo = await this.findUserByCondition({
      username: loginUser.username,
    });

    if (userInfo.password !== hashPassword(loginUser.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    const tokenMap = this.signToken(userInfo);
    const vo = new LoginUserVo({
      userInfo,
      ...tokenMap,
    });
    return vo;
  }

  async updatePassword(userId: number, passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(`captcha_${passwordDto.email}`);

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (passwordDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.userRepository.update(
        { id: userId },
        {
          password: hashPassword(passwordDto.password),
        },
      );
      return null;
    } catch (error) {
      this.logger.error(error, 'UserService');
      throw new HttpException('密码修改失败', HttpStatus.BAD_REQUEST);
    }
  }

  async updateUser(userId: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.redisService.get(
      `captcha_${updateUserDto.email}`,
    );
    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }
    if (updateUserDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }
    const user = new User();

    if (updateUserDto.nickName) {
      user.nickName = updateUserDto.nickName;
    }

    if (updateUserDto.avatar) {
      user.avatar = updateUserDto.avatar;
    }

    try {
      await this.userRepository.update({ id: userId }, user);
      return null;
    } catch (error) {
      this.logger.error(error, 'UserService');
      throw new HttpException('修改用户信息失败', HttpStatus.BAD_REQUEST);
    }
  }

  signToken(userInfo: UserInfo) {
    const accessToken = this.jwtService.sign(
      {
        userId: userInfo.id,
        username: userInfo.username,
        roles: userInfo.roles,
        permissions: userInfo.permissions,
      },
      {
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        userId: userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expires_time') || '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async initData() {
    const user1 = new User();
    user1.username = 'zhangsan';
    user1.password = hashPassword('111111');
    user1.email = 'xxx@xx.com';
    user1.isAdmin = true;
    user1.nickName = '张三';
    user1.phone = '13233323333';

    const user2 = new User();
    user2.username = 'lisi';
    user2.password = hashPassword('222222');
    user2.email = 'yy@yy.com';
    user2.nickName = '李四';

    const role1 = new Role();
    role1.name = '管理员';

    const role2 = new Role();
    role2.name = '普通用户';

    const permission1 = new Permission();
    permission1.permissionKey = 'ccc';
    permission1.description = '访问 ccc 接口';

    const permission2 = new Permission();
    permission2.permissionKey = 'ddd';
    permission2.description = '访问 ddd 接口';

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
  }
}
