import { ObjectSchema } from 'joi';
import { NextFunction, Request, Response } from 'express';
import HTTP_STATUS from '~/constants/http-status';

const validateSchema = (schema: ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        errors: error.details.map((detail) => ({
          message: detail.message,  
        }))
      });
    }
    next();
  };
};

export default validateSchema;