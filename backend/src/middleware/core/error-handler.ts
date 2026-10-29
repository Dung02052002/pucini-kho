import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../../env";
import { AppError } from "../../lib/errors";
import { generateRequestId } from "../../lib/ids";
import { ERROR_CODES, ERROR_MESSAGES } from "../../shared/constants";

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get("requestId") || generateRequestId();

  let status: ContentfulStatusCode = 500;
  let code: string = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  let details: unknown;

  if (err instanceof AppError) {
    status = err.statusCode as ContentfulStatusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof HTTPException) {
    status = err.status as ContentfulStatusCode;
    if (status === 404) {
      code = ERROR_CODES.NOT_FOUND;
      message = ERROR_MESSAGES.NOT_FOUND;
    } else if (status === 400) {
      code = ERROR_CODES.BAD_REQUEST;
      message = ERROR_MESSAGES.BAD_REQUEST;
    } else if (status === 401) {
      code = ERROR_CODES.UNAUTHENTICATED;
      message = ERROR_MESSAGES.UNAUTHENTICATED;
    } else if (status === 403) {
      code = ERROR_CODES.PERMISSION_DENIED;
      message = ERROR_MESSAGES.PERMISSION_DENIED;
    } else {
      code = ERROR_CODES.INTERNAL_SERVER_ERROR;
      message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
    }
  } else {
    // 500 internal error: log error internally, never expose stack trace in response
    console.error(`[Error] requestId=${requestId}:`, err);
    status = 500;
    code = ERROR_CODES.INTERNAL_SERVER_ERROR;
    message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  }

  return c.json(
    {
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
        requestId,
      },
    },
    status,
    {
      "X-Request-Id": requestId,
    },
  );
};

export const notFoundHandler: NotFoundHandler<AppEnv> = (c) => {
  const requestId = c.get("requestId") || generateRequestId();

  return c.json(
    {
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: ERROR_MESSAGES.NOT_FOUND,
        requestId,
      },
    },
    404,
    {
      "X-Request-Id": requestId,
    },
  );
};
