import { z } from "zod";

/** Body của POST /auth/login */
export const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập").trim(),
  pin: z.string().min(4, "Mã PIN/mật khẩu tối thiểu 4 ký tự"),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
