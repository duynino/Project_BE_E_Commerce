import { NextFunction, Request, Response } from 'express'
import HTTP_STATUS from '~/constants/http-status'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR

  return res.status(status).json({
    message: err.message || 'Internal server error',
    status,
    ...(err.errors && { errors: err.errors })
  });
}
