import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  TOKEN: z.string().min(1, { message: "TOKEN is required" }),
  CLIENT_ID: z.string().min(1, { message: "CLIENT_ID is required" }),
  GUILD_ID: z.string().min(1, { message: "GUILD_ID is required" }),
  SUPABASE_URL: z.string().url({ message: "SUPABASE_URL must be a valid URL" }),
  SUPABASE_ANON_KEY: z.string().min(1, { message: "SUPABASE_ANON_KEY is required" }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, { message: "SUPABASE_SERVICE_ROLE_KEY is required" }),
  GOOGLE_CALENDAR_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GOOGLE_CLOUD_SKILLS_BOOST_API_KEY: z.string().optional(),
  DEFAULT_REMINDER_CRON: z.string().default("0 20 * * *"),
  ARCADE_ROLE_ID: z.string().min(1, { message: "ARCADE_ROLE_ID is required" }),
  WELCOME_CHANNEL_ID: z.string().optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:\n", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type EnvConfig = z.infer<typeof envSchema>;
