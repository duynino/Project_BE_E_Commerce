import Joi from 'joi';
import validation from '../utils/validation';

export const createCategoryValidation = validation(Joi.object({
  name: Joi.string().max(100).required(),
  position: Joi.number().optional(),
  bannerImage: Joi.string().optional(), // Or bannerImageKey if uploading via Cloudinary directly
  status: Joi.string().optional(),
  parent_id: Joi.string().uuid().allow(null).optional(),
}));

export const updateCategoryValidation = validation(Joi.object({
  name: Joi.string().max(100).optional(),
  position: Joi.number().optional(),
  bannerImage: Joi.string().optional(),
  status: Joi.string().optional(),
  parent_id: Joi.string().uuid().allow(null).optional(),
}));
