import HTTP_STATUS from '~/constants/http-status';
import USER_MESSAGES from '~/constants/message';

type ErrorsType = Record<
  string,
  {
    msg: string;
    [key: string]: any;
  }
>;

export class ErrorWithStatus extends Error {
  status: number;

  constructor({ message, status }: { message: string; status: number }) {
    super(message);
    this.status = status;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType;

  constructor({
    message = USER_MESSAGES.VALIDATION_ERROR,
    status = HTTP_STATUS.UNPROCESSABLE_ENTITY,
    errors
  }: {
    message?: string;
    status?: number;
    errors: ErrorsType;
  }) {
    super({ message, status });
    this.errors = errors;
  }
}