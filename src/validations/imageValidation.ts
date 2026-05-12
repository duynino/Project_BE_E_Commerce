import Joi from 'joi';
import validation from '../utils/validation';

export const createImageValidation = validation(
  Joi.object({
    url: Joi.string().uri().required(),
    publicId: Joi.string().allow('', null).optional(),
    item_id: Joi.string().uuid().allow('', null).optional(),
  }),
);

export const updateImageValidation = validation(
  Joi.object({
    url: Joi.string().uri().optional(),
    publicId: Joi.string().allow('', null).optional(),
    oldPublicId: Joi.string().allow('', null).optional(),
    item_id: Joi.string().uuid().allow('', null).optional(),
  }).min(1),
);
