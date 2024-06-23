import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from './role.entity';
import { hashPassword } from 'src/utils';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'users' })
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({
    length: 50,
    comment: '用户名',
    unique: true,
  })
  username: string;

  @ApiHideProperty()
  @Exclude()
  @Column({
    length: 100,
    comment: '密码',
  })
  password: string;

  @BeforeInsert()
  private hashPassword() {
    this.password = hashPassword(this.password);
  }

  @Column({
    name: 'nick_name',
    length: 50,
    comment: '昵称',
  })
  @ApiProperty()
  nickName: string;

  @Column({
    length: 50,
    comment: '邮箱',
  })
  @ApiProperty()
  email: string;

  @Column({
    length: 100,
    comment: '头像',
    nullable: true,
  })
  @ApiProperty()
  avatar: string;

  @Column({
    comment: '手机号',
    length: 11,
    nullable: true,
    unique: true,
  })
  @ApiProperty()
  phone: string;

  @Column({
    comment: '是否冻结',
    default: 0,
  })
  @ApiProperty()
  isFrozen: number;

  @Column({
    comment: '是否是管理员',
    default: false,
  })
  @ApiProperty()
  isAdmin: boolean;

  @CreateDateColumn({
    comment: '创建时间',
    name: 'create_time',
  })
  @ApiProperty()
  createTime: Date;

  @UpdateDateColumn({
    comment: '更新时间',
    name: 'update_time',
  })
  updateTime: Date;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
  })
  roles: Role[];

  constructor(mergeObj?: Partial<User>) {
    if (mergeObj) {
      Object.assign(this, mergeObj);
    }
  }
}
