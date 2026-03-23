import Joi from 'joi';
import validation from '../utils/validation';

const authRegisterValidation = validation( Joi.object({
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