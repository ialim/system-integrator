import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '..', '..', '.env')
];

const envPath = envCandidates.find((candidate) => existsSync(candidate));
if (envPath) {
  loadEnv({ path: envPath });
} else {
  loadEnv();
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isDev = nodeEnv === 'development';
const redisPort = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;

const missing: string[] = [];
if (!process.env.DATABASE_URL) {
  missing.push('DATABASE_URL');
}
if (!isDev && !process.env.JWT_SECRET) {
  missing.push('JWT_SECRET');
}

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const env = {
  nodeEnv,
  isDev,
  databaseUrl: process.env.DATABASE_URL as string,
  jwtSecret: (process.env.JWT_SECRET || 'dev-secret') as string,
  port: process.env.PORT ? Number(process.env.PORT) : 3001,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: Number.isFinite(redisPort) ? redisPort : 6379,
  redisPassword: process.env.REDIS_PASSWORD || '',
  webUrl: process.env.WEB_URL || 'http://localhost:3000',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
  mfaIssuer: process.env.MFA_ISSUER || 'Smart Integrator',
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  paystackCallbackUrl: process.env.PAYSTACK_CALLBACK_URL || `${process.env.WEB_URL || 'http://localhost:3000'}/payments/callback`,
  paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || ''
};
