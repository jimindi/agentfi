import { z } from 'zod';

// Environment schema validation
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // NEAR Configuration
  NEAR_NETWORK: z.enum(['mainnet', 'testnet']),
  NEAR_ACCOUNT_ID: z.string().min(1),
  NEAR_PUBLIC_KEY: z.string().startsWith('ed25519:'),
  NEAR_PRIVATE_KEY: z.string().startsWith('ed25519:'),

  // OneClick API
  ONECLICK_JWT_TOKEN: z.string().min(1),

  // JWT & Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  WEBHOOK_SECRET: z.string().min(32, 'WEBHOOK_SECRET must be at least 32 characters'),

  // API Configuration
  API_BASE_URL: z.string().url(),

  // Platform Fee Collection
  FEE_RECIPIENT_ACCOUNT: z.string().min(1),
  PLATFORM_FEE_BPS: z.string().transform(Number).pipe(z.number().min(0).max(10000)),
  MIN_SWAP_VALUE_USD: z.string().transform(Number).pipe(z.number().min(0)),
  AGENTFI_FEE_WALLET: z.string().min(1),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Validate and parse environment variables
export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Singleton instance
let config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!config) {
    config = validateEnv();
  }
  return config;
}
