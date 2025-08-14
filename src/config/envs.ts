import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";

/**
 * Environment variables adapter with multi-environment support
 */

const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(["dev", "prod", "qa"]).default("dev"),
  PORT: z.coerce.number().default(3000),

  // Database Configuration
  DATABASE_PASSWORD: z.string().optional(),
  DATABASE_URL: z.string().url({ message: "Must be a valid URL" }),
  DIRECT_URL: z.string().url({ message: "Must be a valid URL" }).optional(),

  // Supabase Configuration
  SUPABASE_URL: z.string().url({ message: "Must be a valid URL" }),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, { message: "Must have almost 32 characters" }),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("8d"),

  // API Configuration
  API_VERSION: z.string().default("v1"),
  ADMIN_API_KEY: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(600000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(5),

  // CORS Configuration
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3000,http://localhost:3001"),

  // Logging Configuration
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_FILE: z.string().default("logs/app.log"),

  // Email Configuration
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().default("JP Auth API"),

  // Crypto Configuration
  CRYPTO_SECRET: z
    .string()
    .length(64, { message: "Must be 64 hex characters (32 bytes)" }),
  CRYPTO_IV: z
    .string()
    .length(32, { message: "Must be 32 hex characters (16 bytes)" }),
});

type IEnv = z.infer<typeof envSchema>;

const loadEnvironmentConfig = () => {
  // Get the current environment from NODE_ENV or default to 'dev'
  const currentEnv = process.env.NODE_ENV || 'dev';
  
  // Normalize environment names
  const envMap: Record<string, string> = {
    'development': 'dev',
    'production': 'prod',
    'qa': 'qa',
    'dev': 'dev',
    'prod': 'prod'
  };
  
  const normalizedEnv = envMap[currentEnv] || 'dev';
  
  // Load base .env file first
  config({ path: resolve(process.cwd(), '.env') });
  
  // Load environment-specific .env file if it exists
  const envFilePath = resolve(process.cwd(), `.env.${normalizedEnv}`);
  config({ path: envFilePath, override: true });
  
  console.log(`🔧 Loading environment configuration for: ${normalizedEnv}`);
  
  try {
    // Validate environment variables against the schema
    const validatedEnvs = envSchema.parse(process.env);
    console.log(`✅ Environment variables validated successfully for ${normalizedEnv}`);
    return validatedEnvs;
  } catch (error) {
    console.error(`❌ Invalid environment variables for ${normalizedEnv}:`, error);
    throw new Error(`Failed to validate environment variables for ${normalizedEnv}`);
  }
};

const envs = loadEnvironmentConfig();

export default envs;
