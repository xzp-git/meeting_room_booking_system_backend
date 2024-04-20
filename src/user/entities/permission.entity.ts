import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'permissions',
})
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 100,
    comment: '权限key',
    unique: true,
    nullable: false,
    name: 'permission_key',
  })
  permissionKey: string;

  @Column({
    length: 100,
    comment: '权限描述',
  })
  description: string;
}
