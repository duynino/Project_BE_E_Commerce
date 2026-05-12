import Joi from 'joi';
import validation from '../utils/validation';

export const createSupplierValidation = validation(Joi.object({
  companyName: Joi.string().max(255).required(),
  contact: Joi.string().max(255).optional(),
  country: Joi.string().max(100).optional(),
  logoUrl: Joi.string().uri().optional(),
}));

export const updateSupplierValidation = validation(Joi.object({
  companyName: Joi.string().max(255).optional(),
  contact: Joi.string().max(255).optional(),
  country: Joi.string().max(100).optional(),
  logoUrl: Joi.string().uri().optional(),
}));
