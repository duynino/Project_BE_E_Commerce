import { NextFunction, Request, Response } from 'express';
import { ObjectSchema } from 'joi';
import HTTP_STATUS from '~/constants/http-status';
import { EntityError, ErrorWithStatus } from '~/modules/error/error.model';

const validateSchema = (schema: ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (!error) {
      return next();
    }

    const entityError = new EntityError({ errors: {} });

    for (const detail of error.details) {
      const key = detail.context?.key ?? detail.path.join('.');
      // ErrorWithStatus được throw từ custom validator sẽ nằm trong context.error
      const customError = detail.context?.error;

      if (customError instanceof ErrorWithStatus && customError.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(customError);
      }

      entityError.errors[key] = { msg: detail.message };
    }

    next(entityError);
  };
};

export default validateSchema;