import { OmitType } from '@nestjs/mapped-types';
import { User } from '../entities';

export class InfoVo extends OmitType(User, ['password']) {}
