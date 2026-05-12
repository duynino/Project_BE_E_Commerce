import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { StatusCodes } from 'http-status-codes'
import User from '~/interface/user.interface'

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken'
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000
const isProduction = process.env.NODE_ENV === 'production'
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax'
}
const EMAIL_NOT_VERIFIED_CODE = 'EMAIL_NOT_VERIFIED'
const INVALID_CREDENTIALS_CODE = 'INVALID_CREDENTIALS'

const isEmailNotVerifiedError = (message: string) =>
  message.toLowerCase().includes('email is not verified')

const isInvalidCredentialsError = (message: string) =>
  message.toLowerCase().includes('invalid email or password')

const getRequestUserId = (req: Request) => {
  const body = req.body as { user?: User; userId?: string }

  return req.user?.id ?? body.user?.id ?? body.userId
}

export class AuthController {
  private authService: AuthService
  constructor(authService: AuthService) {
    this.authService = authService
  }

  async register(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, password, confirmPassword } = req.body
      if (password !== confirmPassword) {
        return res.status(400).json({
          status: StatusCodes.BAD_REQUEST,
          message: 'Passwords do not match'
        })
      }
      const data = await this.authService.registerUser(
        firstName,
        lastName,
        email,
        password
      )
      return res.status(200).json({
        status: StatusCodes.OK,
        message: 'User registered successfully',
        data
      })
    } catch (error) {
      return res
        .status(400)
        .json({
          status: StatusCodes.BAD_REQUEST,
          message: (error as Error).message
        })
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token, userId } = req.query
      if (typeof token !== 'string') {
        return res
          .status(400)
          .json({ status: StatusCodes.BAD_REQUEST, message: 'Invalid token' })
      }
      if (userId !== undefined && typeof userId !== 'string') {
        return res
          .status(400)
          .json({ status: StatusCodes.BAD_REQUEST, message: 'Invalid userId' })
      }
      const result = await this.authService.verifyEmail(token, userId)
      return res
        .status(200)
        .json({ status: StatusCodes.OK, message: result.message })
    } catch (error) {
      return res
        .status(400)
        .json({
          status: StatusCodes.BAD_REQUEST,
          message: (error as Error).message
        })
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body
      const { accessToken, refreshToken, user } =
        await this.authService.loginUser(email, password)
      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        ...REFRESH_TOKEN_COOKIE_OPTIONS,
        maxAge: REFRESH_TOKEN_MAX_AGE
      })

      return res.status(200).json({
        status: StatusCodes.OK,
        message: 'Login successful',
        data: { accessToken, user }
      })
    } catch (error) {
      const message = (error as Error).message
      if (isEmailNotVerifiedError(message)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          status: StatusCodes.FORBIDDEN,
          code: EMAIL_NOT_VERIFIED_CODE,
          message: 'Email is not verified'
        })
      }

      if (isInvalidCredentialsError(message)) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: StatusCodes.UNAUTHORIZED,
          code: INVALID_CREDENTIALS_CODE,
          message: 'Invalid email or password'
        })
      }
      return res.status(400).json({ status: StatusCodes.BAD_REQUEST, message })
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = getRequestUserId(req)
      console.log('Current user ID:', userId)
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: StatusCodes.UNAUTHORIZED,
          message: 'Unauthorized'
        })
      }

      const result = await this.authService.getCurrentUser(userId)

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: 'Get current user successfully',
        data: result
      })
    } catch (error) {
      const errorMessage = (error as Error).message
      const isUnauthorized = errorMessage === 'User not found' || errorMessage === 'Unauthorized'

      return res
        .status(isUnauthorized ? StatusCodes.UNAUTHORIZED : StatusCodes.BAD_REQUEST)
        .json({
          status: isUnauthorized ? StatusCodes.UNAUTHORIZED : StatusCodes.BAD_REQUEST,
          message: errorMessage
        })
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const userId = getRequestUserId(req)
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: StatusCodes.UNAUTHORIZED,
          message: 'Unauthorized'
        })
      }

      const result = await this.authService.logoutUser(userId)
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_OPTIONS)
      return res
        .status(200)
        .json({ status: StatusCodes.OK, message: result.message })
    } catch (error) {
      return res
        .status(400)
        .json({
          status: StatusCodes.BAD_REQUEST,
          message: (error as Error).message
        })
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]
      if (!refreshToken) {
        return res
          .status(400)
          .json({
            status: StatusCodes.BAD_REQUEST,
            message: 'Refresh token is not exists'
          })
      }
      const result = await this.authService.refreshToken(refreshToken)

      if (result.refreshToken) {
        res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
          ...REFRESH_TOKEN_COOKIE_OPTIONS,
          maxAge: REFRESH_TOKEN_MAX_AGE
        })
      }

      return res.status(200).json({
        status: StatusCodes.OK,
        message: 'Token refreshed successfully',
        data: { accessToken: result.accessToken }
      })
    } catch (error) {
      return res
        .status(400)
        .json({
          status: StatusCodes.BAD_REQUEST,
          message: (error as Error).message
        })
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const email = req.query.email ?? req.body?.email
      if (typeof email !== 'string' || !email.trim()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: 'Email is required'
        })
      }

      await this.authService.forgotPassword(email)
      return res.status(200).json({
        status: StatusCodes.OK,
        message: 'Password reset email sent successfully'
      })
    } catch (error) {
      return res
        .status(400)
        .json({
          status: StatusCodes.BAD_REQUEST,
          message: (error as Error).message
        })
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, userId, password, newPassword, confirmPassword } = req.body
      const nextPassword = newPassword ?? password
      if (typeof token !== 'string' || !token.trim()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: 'Token is required'
        })
      }
      if (userId !== undefined && typeof userId !== 'string') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: 'Invalid userId'
        })
      }
      if (typeof nextPassword !== 'string' || typeof confirmPassword !== 'string') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: 'Password and confirmPassword are required'
        })
      }
      const result = await this.authService.resetPassword(
        token,
        userId,
        nextPassword,
        confirmPassword
      )
      return res
        .status(200)
        .json({
          status: StatusCodes.OK,
          message: result.message,
          data: result.user
        })
    } catch (error) {
      return res
        .status(400)
        .json({
          status: StatusCodes.BAD_REQUEST,
          message: (error as Error).message
        })
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body
      const userId = getRequestUserId(req)
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: StatusCodes.UNAUTHORIZED,
          message: 'Unauthorized'
        })
      }

      const result = await this.authService.changePassword(
        userId,
        oldPassword,
        newPassword,
        confirmPassword
      )

      if (result.refreshToken) {
        res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
          ...REFRESH_TOKEN_COOKIE_OPTIONS,
          maxAge: REFRESH_TOKEN_MAX_AGE
        })
      }

      return res
        .status(200)
        .json({
          status: StatusCodes.OK,
          message: result.message,
          data: {
            user: result.user,
            accessToken: result.accessToken
          }
        })
    } catch (error) {
      return res
        .status(400)
        .json({
          status: StatusCodes.BAD_REQUEST,
          message: (error as Error).message
        })
    }
  }
}
