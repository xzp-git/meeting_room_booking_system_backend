import { PickType, PartialType } from '@nestjs/mapped-types';
import { RegisterUserDto } from './register-user.dto';

export class UpdateUserDto extends PartialType(
  PickType(RegisterUserDto, ['captcha', 'email']),
) {
  avatar: string;
  nickName: string;
}
