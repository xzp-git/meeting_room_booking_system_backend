import {
  Controller,
  Post,
  Body,
  Get,
  Inject,
  Query,
  UnauthorizedException,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  LoginUserDto,
  RegisterUserDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
} from './dto';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RequireLogin, UserInfo } from 'src/decorator';

@Controller('user')
export class UserController {
  @Inject(RedisService)
  private readonly redisService: RedisService;

  @Inject(EmailService)
  private readonly emailService: EmailService;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  @Get('getCaptcha')
  async getCaptcha(@Query('email') email: string) {
    const code = Math.random().toString().slice(2, 8);
    await this.redisService.set(`captcha_${email}`, code, 5 * 60);
    await this.emailService.sendEmail({
      to: email,
      subject: '灵境畅议验证码',
      html: `<p>您的验证码是${code}</P>`,
    });
    return '发送成功';
  }

  @Post('login')
  async clientLogin(@Body() loginUser: LoginUserDto) {
    return this.userService.login(loginUser);
  }

  // @Post('admin/login')
  // async adminLogin(@Body() loginUser: LoginUserDto) {
  //   return this.userService.login(loginUser);
  // }

  @Get('refresh')
  async refreshToken(@Query('refreshToken') refreshToken: string) {
    try {
      const data = await this.jwtService.verify(refreshToken);
      const userInfo = await this.userService.findUserByCondition({
        id: data.userId,
      });
      return this.userService.signToken(userInfo);
    } catch (error) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }
  @Get('info')
  @RequireLogin()
  @UseInterceptors(ClassSerializerInterceptor)
  async info(@UserInfo('userId') userId: number) {
    return this.userService.findUserById({ id: userId });
  }

  @Post('updatePassword')
  @RequireLogin()
  async updatePassword(
    @UserInfo('userId') userId: number,
    @Body() passwordDto: UpdateUserPasswordDto,
  ) {
    return this.userService.updatePassword(userId, passwordDto);
  }

  @Post('update')
  @RequireLogin()
  async updateUser(
    @UserInfo('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(userId, updateUserDto);
  }

  @Get('init-data')
  async initData() {
    return 'done';
  }
}
