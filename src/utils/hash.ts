import * as crypto from 'crypto';
const salt = 'niu';
export function hashPassword(password: string) {
  const passwordHash = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');

  return passwordHash;
}
