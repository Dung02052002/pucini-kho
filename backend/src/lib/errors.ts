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

export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND, details?: unknown) {
    super(message, 404, ERROR_CODES.NOT_FOUND, details);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.VALIDATION_ERROR,
    details?: unknown,
  ) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN, details?: unknown) {
    super(message, 403, ERROR_CODES.FORBIDDEN, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = ERROR_MESSAGES.CONFLICT, details?: unknown) {
    super(message, 409, ERROR_CODES.CONFLICT, details);
  }
}
