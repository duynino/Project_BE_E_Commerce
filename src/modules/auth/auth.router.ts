import { Router, Request, Response } from 'express'
import {
  authRegisterValidation,
  authLoginValidation
} from '~/validations/authValidation'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AppDataSource } from '~/config/db-config'
import { authenticate } from '~/middlewares/auth.middlewares'
import { redisService } from '~/common/redis/redis.service'
import { emailQueue } from '~/utils/queue'

const router = Router()
const authService = new AuthService(AppDataSource, redisService, emailQueue)
const authController = new AuthController(authService)

router.post(
  '/register',
  authRegisterValidation,
  (req: Request, res: Response) => {
    return authController.register(req, res)
  }
)

router.get('/verify-email', (req: Request, res: Response) => {
  return authController.verifyEmail(req, res)
})

router.post('/login', authLoginValidation, (req: Request, res: Response) => {
  return authController.login(req, res)
})

router.get('/me', authenticate, (req: Request, res: Response) => {
  return authController.getCurrentUser(req, res)
})

router.post('/logout', authenticate, (req: Request, res: Response) => {
  return authController.logout(req, res)
})

router.post('/refresh-token', (req: Request, res: Response) => {
  return authController.refreshToken(req, res)
})

router.post('/forgot-password', (req: Request, res: Response) => {
  return authController.forgotPassword(req, res)
})

router.post('/reset-password', (req: Request, res: Response) => {
  return authController.resetPassword(req, res)
})

router.post('/change-password', authenticate, (req: Request, res: Response) => {
  return authController.changePassword(req, res)
})
export default router
