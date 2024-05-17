export interface UserInfo {
  id: number;

  username: string;

  nickName: string;

  email: string;

  avatar: string;

  phone: string;

  isFrozen: boolean;

  isAdmin: boolean;

  createTime: Date;

  roles: string[];

  permissions: string[];
}
export class LoginUserVo {
  userInfo: UserInfo;

  accessToken: string;

  refreshToken: string;

  constructor(arg: {
    userInfo: UserInfo;
    accessToken?: string;
    refreshToken?: string;
  }) {
    Object.assign(this, arg);
  }
}
