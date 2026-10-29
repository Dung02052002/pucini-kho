import {
  ERROR_CODES,
  ERROR_MESSAGES,
  type ErrorCode,
} from "../shared/constants";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = ERROR_MESSAGES.BAD_REQUEST, details?: unknown) {
    super(message, 400, ERROR_CODES.BAD_REQUEST, details);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.VALIDATION_ERROR,
    details?: unknown,
  ) {
    super(message, 422, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.UNAUTHENTICATED,
    details?: unknown,
  ) {
    super(message, 401, ERROR_CODES.UNAUTHENTICATED, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN, details?: unknown) {
    super(message, 403, ERROR_CODES.FORBIDDEN, details);
  }
}

export class PermissionDeniedError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.PERMISSION_DENIED,
    details?: unknown,
  ) {
    super(message, 403, ERROR_CODES.PERMISSION_DENIED, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND, details?: unknown) {
    super(message, 404, ERROR_CODES.NOT_FOUND, details);
  }
}

export class QrInvalidError extends AppError {
  constructor(message: string = ERROR_MESSAGES.QR_INVALID, details?: unknown) {
    super(message, 404, ERROR_CODES.QR_INVALID, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = ERROR_MESSAGES.CONFLICT, details?: unknown) {
    super(message, 409, ERROR_CODES.CONFLICT, details);
  }
}

export class UndoExpiredError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.UNDO_EXPIRED,
    details?: unknown,
  ) {
    super(message, 409, ERROR_CODES.UNDO_EXPIRED, details);
  }
}

export class AlreadyCanceledError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.ALREADY_CANCELED,
    details?: unknown,
  ) {
    super(message, 409, ERROR_CODES.ALREADY_CANCELED, details);
  }
}

export class BatchNotOpenError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.BATCH_NOT_OPEN,
    details?: unknown,
  ) {
    super(message, 409, ERROR_CODES.BATCH_NOT_OPEN, details);
  }
}

export class AccountLockedError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.ACCOUNT_LOCKED,
    details?: unknown,
  ) {
    super(message, 423, ERROR_CODES.ACCOUNT_LOCKED, details);
  }
}

export class SyncThrottledError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.SYNC_THROTTLED,
    details?: unknown,
  ) {
    super(message, 429, ERROR_CODES.SYNC_THROTTLED, details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.PAYLOAD_TOO_LARGE,
    details?: unknown,
  ) {
    super(message, 413, ERROR_CODES.PAYLOAD_TOO_LARGE, details);
  }
}

export class KvUpstreamError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.KV_UPSTREAM_ERROR,
    details?: unknown,
  ) {
    super(message, 502, ERROR_CODES.KV_UPSTREAM_ERROR, details);
  }
}

export class InternalServerError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    details?: unknown,
  ) {
    super(message, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, details);
  }
}
