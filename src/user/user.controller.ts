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
  DefaultValuePipe,
  HttpStatus,
  UploadedFile,
  BadRequestException,
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
import { generateParseIntPipe } from 'src/utils';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginUserVo } from './vo/login-user.vo';
import { RefreshTokenVo } from './vo/refresh-token.vo';
import { User } from './entities';
import { JwtUserData } from 'src/guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage } from './my-file-storage';
import * as path from 'path';

@ApiTags('用户管理模块')
@Controller('/api/v1/user')
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

  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/验证码不正确/用户已存在',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功/失败',
    type: String,
  })
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  @ApiQuery({
    name: 'email',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xxx@xx.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String,
  })
  @Get('captcha')
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

  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String,
  })
  @ApiBearerAuth()
  @RequireLogin()
  @Get('update/captcha')
  async getUpdateUserInfoCaptcha(@UserInfo('email') email: string) {
    const code = Math.random().toString().slice(2, 8);
    await this.redisService.set(
      `update_user_info_captcha_${email}`,
      code,
      5 * 60,
    );
    await this.emailService.sendEmail({
      to: email,
      subject: '灵境畅议更新用户信息验证码',
      html: `<p>您的验证码是${code}</P>`,
    });
    return '发送成功';
  }

  @ApiBody({
    type: LoginUserDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户不存在/密码错误',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和 token',
    type: LoginUserVo,
  })
  @Post('login')
  async clientLogin(@Body() loginUser: LoginUserDto) {
    return this.userService.login(loginUser);
  }

  // @Post('admin/login')
  // async adminLogin(@Body() loginUser: LoginUserDto) {
  //   return this.userService.login(loginUser);
  // }

  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: '刷新 token',
    required: true,
    example: 'xxxxxxxxyyyyyyyyzzzzz',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token 已失效，请重新登录',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: RefreshTokenVo,
  })
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
  @ApiQuery({
    name: 'userId',
    type: Number,
    description: '用户 id',
    required: true,
    example: 1,
  })
  @ApiOperation({ summary: 'info' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: User,
  })
  @Get('info')
  @RequireLogin()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  async info(@UserInfo('userId') userId: number) {
    return this.userService.findUserById({ id: userId });
  }

  @ApiBody({
    type: UpdateUserPasswordDto,
  })
  @ApiResponse({
    type: String,
    description: '验证码已失效/不正确',
  })
  @Post('update/password')
  async updatePassword(@Body() passwordDto: UpdateUserPasswordDto) {
    return this.userService.updatePassword(passwordDto);
  }

  @Post('update/userinfo')
  @RequireLogin()
  async updateUser(
    @UserInfo() userInfo: JwtUserData,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(userInfo, updateUserDto);
  }
  @Get('freeze')
  @RequireLogin()
  async freezeUser(
    @Query('id') userId: number,
    @Query('freeze') freze: number,
  ) {
    await this.userService.freezeUserById(userId, freze);
    return null;
  }

  @Get('list')
  @RequireLogin()
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(2),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('username') username: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string,
  ) {
    return this.userService.findUserByPage(
      username,
      nickName,
      email,
      pageNo,
      pageSize,
    );
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads',
      storage,
      limits: {
        fileSize: 1024 * 1024 * 3,
      },
      fileFilter(req, file, callback) {
        const extname = path.extname(file.originalname);
        if (['.png', '.jpg', '.gif'].includes(extname)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('只能上传图片'), false);
        }
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    return file.path;
  }

  @Get('init-data')
  async initData() {
    this.userService.initData();
    return 'done';
  }
}
