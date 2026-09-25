import { env } from 'cloudflare:workers';

type HolyartedEnv = {
  DB?: D1Database;
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PLUS_PRICE_ID?: string;
  STRIPE_PREMIUM_PRICE_ID?: string;
};

export const runtimeEnv = env as unknown as HolyartedEnv;

export type PublicAuthConfig = {
  url: string;
  publishableKey: string;
};

export function getPublicAuthConfig(): PublicAuthConfig | null {
  const url = runtimeEnv.SUPABASE_URL?.trim();
  const publishableKey = runtimeEnv.SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && publishableKey ? { url, publishableKey } : null;
}

export function requireRuntimeValue(
  key: keyof Omit<HolyartedEnv, 'DB'>,
): string {
  const value = runtimeEnv[key]?.trim();
  if (!value) throw new Error(`Missing runtime configuration: ${key}`);
  return value;
}
