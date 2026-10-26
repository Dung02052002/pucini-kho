import { z } from "zod";
import { USER_PERMISSIONS, USER_ROLES } from "../../shared/constants";

export const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập").trim(),
  pin: z.string().min(4, "Mã PIN/mật khẩu tối thiểu 4 ký tự"),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const authUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  fullName: z.string(),
  role: z.enum(USER_ROLES),
  permissions: z.array(z.enum(USER_PERMISSIONS)),
});

export type AuthUserDto = z.infer<typeof authUserSchema>;

export const meResponseSchema = z.object({
  user: authUserSchema,
  openBatch: z
    .object({
      id: z.number(),
      code: z.string(),
      status: z.string(),
      purpose: z.string(),
    })
    .nullable(),
  openTaskCount: z.number(),
});

export type MeResponseDto = z.infer<typeof meResponseSchema>;
