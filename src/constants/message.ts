const USER_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  EMAIL_IS_REQUIRED: 'Email is required',
  INVALID_EMAIL_FORMAT: 'Invalid email format',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_LENGTH_MUST_BE_BETWEEN_6_AND_20: 'Password length must be between 6 and 20 characters',
  PASSWORD_STRONG_REQUIREMENTS:
    'Password must have a minimum length of 6 characters, at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirmation password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirmation password must be a string',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_BETWEEN_6_AND_20: 'Confirmation password length must be between 6 and 20 characters',
  PASSWORD_CONFIRMATION_MISMATCH: 'Password confirmation does not match password',
  DATE_OF_BIRTH_IS_REQUIRED: 'Date of birth is required',
  USER_NOT_FOUND: 'User not found',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  VERIFY_EMAIL_TOKEN_IS_REQUIRED: 'Verify email token is required',
  ACCOUNT_ALREADY_VERIFIED: 'Account already verified',
  LOGOUT_SUCCESS: 'Logout successful',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required',
  INSUFFICIENT_PERMISSIONS: 'Your account does not have the necessary privileges to perform this action.',
  NAME_LENGTH_MUST_BE_FROM_1_TO_20: 'Name length must be between 1 and 20 characters.',
  INVALID_DATE_FORMAT: 'Invalid date format. Please use the ISO 8601 format.',
  BIO_LENGTH_MUST_BE_LESS_THAN_255: 'Bio length must be less than 255 characters.',
  LOCATION_LENGTH_MUST_BE_LESS_THAN_50: 'Location length must be less than 50 characters.',
  INVALID_URL_FORMAT: 'Invalid URL format.',
  USERNAME_MUST_BE_STRING: 'Username must be string'
};

export default USER_MESSAGES;
