import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL_NEW: z.string().url().min(1, 'DATABASE_URL_NEW is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  FRONTEND_URL: z.string().url().min(1, 'FRONTEND_URL is required'),
  LOGINPAGE: z.string().url().min(1, 'LOGINPAGE URL is required'),
  RESETPAGE: z.string().url().min(1, 'RESETPAGE URL is required'),
  GMAIL_USERNAME: z.string().email().optional(),
  GMAIL_PASS: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(1337),

  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_API_KEY_ENCRYPTION_SECRET: z
    .string()
    .min(32, 'AI_API_KEY_ENCRYPTION_SECRET must be at least 32 bytes long for AES-256'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error(
    'Invalid environment variables. Please check your .env file, especially required secrets like AI_API_KEY_ENCRYPTION_SECRET.',
  );
}

export const config = parsedEnv.data;

console.log(`✅ Configuration loaded successfully for ${config.NODE_ENV} environment.`);
