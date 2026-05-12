import { Router, Request, Response } from 'express'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { AppDataSource } from '~/config/db-config'
import { authenticate, checkPermissions } from '~/middlewares/auth.middlewares'
import PERMISSION from '~/constants/permission'
import {
  updateUserValidation,
  createUserValidation
} from '~/validations/userValidation'
import {
  handleSingleUpload,
  handleUpdateImageUpload,
  applyUploadedFileToBody
} from '~/middlewares/upload.middlewares'

const router = Router()
const userService = new UserService(AppDataSource)
const userController = new UserController(userService)

router.use(authenticate)

// User
router.get('/profile', (req: Request, res: Response) => {
  return userController.getProfileUser(req, res)
})

router.put('/profile', updateUserValidation, (req: Request, res: Response) => {
  return userController.updateProfileUser(req, res)
})

router.put(
  '/profile/avatar',
  handleUpdateImageUpload('avatar', 'avatars'),
  applyUploadedFileToBody,
  (req: Request, res: Response) => {
    return userController.updateAvatarUser(req, res)
  }
)

// Admin
router.get(
  '/',
  checkPermissions(PERMISSION.VIEW_USERS),
  (req: Request, res: Response) => {
    return userController.getAllUsers(req, res)
  }
)

router.post(
  '/send-invitation',
  checkPermissions(PERMISSION.SEND_INVITATION),
  (req: Request, res: Response) => {
    return userController.sendInvitationUser(req, res)
  }
)

router.post(
  '/',
  checkPermissions(PERMISSION.CREATE_USER),
  handleSingleUpload('avatar', 'avatars'),
  applyUploadedFileToBody,
  createUserValidation,
  (req: Request, res: Response) => {
    return userController.createUser(req, res)
  }
)

router.delete(
  '/:id',
  checkPermissions(PERMISSION.DELETE_USER),
  (req: Request, res: Response) => {
    return userController.deleteUser(req, res)
  }
)

// User or Admin
router.get(
  '/:id',
  checkPermissions(PERMISSION.VIEW_USER),
  (req: Request, res: Response) => {
    return userController.getUserById(req, res)
  }
)

router.put(
  '/:id',
  checkPermissions(PERMISSION.UPDATE_USER),
  handleUpdateImageUpload('avatar', 'avatars'),
  applyUploadedFileToBody,
  updateUserValidation,
  (req: Request, res: Response) => {
    return userController.updateUser(req, res)
  }
)

export default router
