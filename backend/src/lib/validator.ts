import { zValidator as honoZValidator } from "@hono/zod-validator";
import type { Context, ValidationTargets } from "hono";
import type { ZodSchema } from "zod";
import type { AppEnv } from "../env";
import { ERROR_CODES, ERROR_MESSAGES } from "../shared/constants";
import { generateRequestId } from "./ids";

/**
 * Custom Zod validator middleware for Hono
 * Returns HTTP 422 with standard error format when validation fails
 */
export const zValidator = <
  Target extends keyof ValidationTargets,
  Schema extends ZodSchema,
>(
  target: Target,
  schema: Schema,
) =>
  honoZValidator(target, schema, (result, c) => {
    if (!result.success) {
      const appCtx = c as unknown as Context<AppEnv>;
      const requestId =
        appCtx.get("requestId") ||
        c.req.header("x-request-id") ||
        generateRequestId();

      return c.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: ERROR_MESSAGES.VALIDATION_ERROR,
            details: result.error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
            requestId,
          },
        },
        422,
        {
          "X-Request-Id": requestId,
        },
      );
    }
  });
