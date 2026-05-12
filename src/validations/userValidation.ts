import Joi from 'joi';
import validation from '../utils/validation';

const genderValidation = Joi.alternatives().try(
  Joi.number().valid(0, 1, 2, 3),
  Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
);

export const createUserValidation = validation(Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  gender: genderValidation.optional(),
  age: Joi.number().optional(),
  phoneNumber: Joi.string().max(15).optional(),
  dateOfBirth: Joi.date().optional(),
  address: Joi.string().optional(),
}));

export const updateUserValidation = validation(Joi.object({
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  gender: genderValidation.optional(),
  age: Joi.number().optional(),
  phoneNumber: Joi.string().max(15).optional(),
  dateOfBirth: Joi.date().optional(),
  address: Joi.string().optional(),
  avatarKey: Joi.string().optional(), // For Cloudinary upload flow
}));
