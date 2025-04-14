import { randomBytes } from 'crypto';

export function createRandomSecret(): Buffer {
  return randomBytes(32);
}