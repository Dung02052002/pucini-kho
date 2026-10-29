import { z } from "zod";
import { authUserSchema } from "./auth-user.schema";

/** Response của GET /auth/me */
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
