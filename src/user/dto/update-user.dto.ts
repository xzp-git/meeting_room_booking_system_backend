import { PickType } from '@nestjs/mapped-types';
import { RegisterUserDto } from './register-user.dto';

export class UpdateUserDto extends PickType(RegisterUserDto, [
  'captcha',
  'email',
]) {
  avatar: string;
  nickName: string;
}
