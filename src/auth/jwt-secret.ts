import { randomBytes } from 'crypto';

let developmentSecret: string | null = null;

export function getJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) return configuredSecret;

  if (process.env.NODE_ENV !== 'development') {
    throw new Error('JWT_SECRET is required when NODE_ENV is not development');
  }

  if (!developmentSecret) {
    developmentSecret = randomBytes(32).toString('hex');
  }

  return developmentSecret;
}

