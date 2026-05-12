import Joi from 'joi';
import validation from '../utils/validation';

export const createItemVariantValidation = validation(Joi.object({
  item_id: Joi.string().uuid().required(),
  sku: Joi.string().max(100).optional(),
  stock: Joi.number().integer().min(0).optional(),
  purchasePrice: Joi.number().precision(2).optional(),
  salePrice: Joi.number().precision(2).optional(),
  attributes: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
}));

export const updateItemVariantValidation = validation(Joi.object({
  item_id: Joi.string().uuid().optional(),
  sku: Joi.string().max(100).optional(),
  stock: Joi.number().integer().min(0).optional(),
  purchasePrice: Joi.number().precision(2).optional(),
  salePrice: Joi.number().precision(2).optional(),
  attributes: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
}));
