import type { Database } from "./db/client";
import type { UserPermission, UserRole } from "./shared/constants";

export type Bindings = {
  DB: D1Database;
  ENVIRONMENT?: string;
  APP_VERSION?: string;
  KV_RETAILER?: string;
  KV_BRANCH_ID?: string;
  KV_CLIENT_ID?: string;
  KV_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
  KV_WEBHOOK_SECRET?: string;
  APP_TZ?: string;
  CORS_ORIGINS?: string;
  /** Cloudflare Rate Limiting binding cho /auth/login (khai báo trong wrangler.jsonc) */
  LOGIN_RATE_LIMITER?: RateLimit;
};

export type AuthUser = {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  permissions: UserPermission[];
};

export type AuthSession = {
  /** SHA-256 của session token (giá trị lưu trong DB), KHÔNG phải token gốc trong cookie */
  id: string;
  userId: number;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
};

export type Variables = {
  requestId: string;
  db: Database;
  user?: AuthUser;
  session?: AuthSession;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
