import { z } from "zod";
import type { Bindings } from "./env";

const DEV_CORS_ORIGINS =
  "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173";

/**
 * Tách chuỗi "a,b,c" thành danh sách origin và kiểm tra từng origin hợp lệ.
 * Không cho phép "*": API dùng cookie (credentials) nên wildcard đồng nghĩa
 * với việc mọi website đều đọc được dữ liệu của người dùng đang đăng nhập.
 */
const corsOriginsSchema = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .pipe(
    z
      .array(
        z.string().refine((origin) => {
          try {
            return new URL(origin).origin === origin;
          } catch {
            return false;
          }
        }, "CORS origin phải có dạng scheme://host[:port], không chứa '*' hay path"),
      )
      .min(1, "CORS_ORIGINS không được rỗng"),
  );

export const configSchema = z
  .object({
    ENVIRONMENT: z
      .enum(["development", "staging", "production"])
      .default("development"),
    APP_VERSION: z.string().default("1.0.0"),
    APP_TZ: z.string().default("Asia/Ho_Chi_Minh"),
    KV_RETAILER: z.string().optional(),
    KV_BRANCH_ID: z.string().optional(),
    SESSION_SECRET: z.string().optional(),
    CORS_ORIGINS: z.string().optional(),
  })
  .superRefine((config, ctx) => {
    // Production bắt buộc khai báo origin của frontend, không được rơi về mặc định localhost
    if (config.ENVIRONMENT === "production" && !config.CORS_ORIGINS) {
      ctx.addIssue({
        code: "custom",
        path: ["CORS_ORIGINS"],
        message: "CORS_ORIGINS là bắt buộc khi ENVIRONMENT=production",
      });
    }
  })
  .transform((config, ctx) => {
    const origins = corsOriginsSchema.safeParse(
      config.CORS_ORIGINS ?? DEV_CORS_ORIGINS,
    );
    if (!origins.success) {
      for (const issue of origins.error.issues) {
        ctx.addIssue({ ...issue, path: ["CORS_ORIGINS", ...issue.path] });
      }
      return z.NEVER;
    }
    return { ...config, CORS_ORIGINS: origins.data };
  });

export type Config = z.infer<typeof configSchema>;

export function getConfig(env: Bindings): Config {
  return configSchema.parse({
    ENVIRONMENT: env.ENVIRONMENT ?? "development",
    APP_VERSION: env.APP_VERSION ?? "1.0.0",
    APP_TZ: env.APP_TZ ?? "Asia/Ho_Chi_Minh",
    KV_RETAILER: env.KV_RETAILER,
    KV_BRANCH_ID: env.KV_BRANCH_ID,
    SESSION_SECRET: env.SESSION_SECRET,
    CORS_ORIGINS: env.CORS_ORIGINS,
  });
}
