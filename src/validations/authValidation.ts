import Joi from 'joi';
import validation from '../utils/validation';

const authRegisterValidation = validation( Joi.object({
  firstName: Joi.string().min(2).max(30).required().messages({
    'string.base': 'First name must be a string',
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name must be at most 30 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(30).required().messages({
    'string.base': 'Last name must be a string',
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name must be at most 30 characters',
    'any.required': 'Last name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
        'string.base': 'Mật khẩu phải là một chuỗi',
        'string.empty': 'Mật khẩu không được để trống',
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'string.max': 'Mật khẩu chỉ được tối đa 30 ký tự',
        'any.required': 'Mật khẩu là bắt buộc'
    }),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
    'any.only': 'Confirm password must match password',
    'string.empty': 'Confirm password is required',
  }),
   
  isVerified: Joi.boolean().optional().default(false),
}));

const authLoginValidation = validation( Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
}));

export {  
  authRegisterValidation,
  authLoginValidation
};