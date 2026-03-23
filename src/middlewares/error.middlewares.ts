import { NextFunction, Request, Response } from 'express';
import HTTP_STATUS from '~/constants/http-status';

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  return res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    status: err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors: err.errors || {}
  });
};
