import { PickType } from '@nestjs/mapped-types';
import { RegisterUserDto } from './register-user.dto';

export class UpdateUserPasswordDto extends PickType(RegisterUserDto, [
  'password',
  'captcha',
  'email',
  'username',
]) {}
