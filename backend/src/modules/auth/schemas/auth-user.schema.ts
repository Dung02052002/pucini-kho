import { z } from "zod";
import { USER_PERMISSIONS, USER_ROLES } from "../../../shared/constants";

/** Thông tin user trả về cho client (dùng chung cho login và /me) */
export const authUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  fullName: z.string(),
  role: z.enum(USER_ROLES),
  permissions: z.array(z.enum(USER_PERMISSIONS)),
});

export type AuthUserDto = z.infer<typeof authUserSchema>;
