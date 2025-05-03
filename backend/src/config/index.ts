import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Database
  DATABASE_URL_NEW: z.string().url().min(1, 'DATABASE_URL_NEW is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),

  // Frontend URLs
  FRONTEND_URL: z.string().url().min(1, 'FRONTEND_URL is required'),
  LOGINPAGE: z.string().url().min(1, 'LOGINPAGE URL is required'),
  RESETPAGE: z.string().url().min(1, 'RESETPAGE URL is required'),

  // Email (Optional)
  GMAIL_USERNAME: z.string().email().optional(),
  GMAIL_PASS: z.string().min(1).optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server Port
  PORT: z.coerce.number().int().positive().default(1337),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  // Add other necessary environment variables here
});

// Validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables. Please check your .env file.');
}

// Export the validated and typed configuration object
export const config = parsedEnv.data;

// Log successful loading (optional)
console.log(`✅ Configuration loaded successfully for ${config.NODE_ENV} environment.`);
