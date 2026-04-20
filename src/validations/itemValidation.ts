import Joi from 'joi';
import validation from '../utils/validation';

export const createItemValidation = validation(Joi.object({
  name: Joi.string().max(100).required(),
  barcode: Joi.string().optional(),
  thumbnail: Joi.string().optional(),
  unit: Joi.string().optional(),
  quantity: Joi.number().integer().min(0).optional(),
  weight: Joi.number().precision(2).optional(),
  purchasePrice: Joi.number().precision(2).optional(),
  salePrice: Joi.number().precision(2).optional(),
  description: Joi.string().optional(),
  category_id: Joi.string().uuid().optional(),
  imageKeys: Joi.array().items(Joi.string()).optional(), // Cloudinary public_ids mapping
}));

export const updateItemValidation = validation(Joi.object({
  name: Joi.string().max(100).optional(),
  barcode: Joi.string().optional(),
  thumbnail: Joi.string().optional(),
  unit: Joi.string().optional(),
  quantity: Joi.number().integer().min(0).optional(),
  weight: Joi.number().precision(2).optional(),
  purchasePrice: Joi.number().precision(2).optional(),
  salePrice: Joi.number().precision(2).optional(),
  description: Joi.string().optional(),
  category_id: Joi.string().uuid().optional(),
  imageKeys: Joi.array().items(Joi.string()).optional(),
}));
