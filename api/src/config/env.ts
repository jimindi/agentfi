import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  NEAR_NETWORK: z.enum(['testnet', 'mainnet']),
  NEAR_ACCOUNT_ID: z.string().min(1),
  NEAR_PRIVATE_KEY: z.string().startsWith('ed25519:'),
  JWT_SECRET: z.string().min(32),
  WEBHOOK_SECRET: z.string().min(32),
  API_BASE_URL: z.string().url()
});

export const env = envSchema.parse(process.env);
