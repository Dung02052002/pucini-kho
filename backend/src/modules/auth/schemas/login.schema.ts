import { z } from "zod";

/**
 * Body của POST /auth/login.
 * Có giới hạn độ dài tối đa để chặn payload bất thường trước khi chạy PBKDF2.
 */
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên đăng nhập")
    .max(64, "Tên đăng nhập tối đa 64 ký tự"),
  pin: z
    .string()
    .min(4, "Mã PIN/mật khẩu tối thiểu 4 ký tự")
    .max(128, "Mã PIN/mật khẩu tối đa 128 ký tự"),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
