import bcrypt from 'bcryptjs';

/**
 * Password hashing. We use bcryptjs (pure-JS bcrypt) rather than the native
 * `bcrypt` addon so the API builds and deploys anywhere — CI, Railway,
 * serverless — with no node-gyp toolchain. Cost 12 is a sensible 2020s default.
 */
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
