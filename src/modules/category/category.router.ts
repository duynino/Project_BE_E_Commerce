import { Router, Request, Response } from 'express'
import { CategoryController } from './category.controller'
import { CategoryService } from './category.service'
import { AppDataSource } from '~/config/db-config'
import { authenticate, checkPermissions } from '~/middlewares/auth.middlewares'
import {
  handleSingleUpload,
  handleUpdateImageUpload,
  applyUploadedFileToBody
} from '~/middlewares/upload.middlewares'
import PERMISSION from '~/constants/permission'
import {
  createCategoryValidation,
  updateCategoryValidation
} from '~/validations/categoryValidation'

const router = Router()
const categoryService = new CategoryService(AppDataSource)
const categoryController = new CategoryController(categoryService)

router.get(
  '/get-all',
  (req: Request, res: Response) => {
    return categoryController.getAllCategories(req, res)
  }
)

router.get(
  '/:id',
  (req: Request, res: Response) => {
    return categoryController.getCategoryById(req, res)
  }
)

router.use(authenticate)

router.post(
  '/create',
  checkPermissions(PERMISSION.CREATE_CATEGORY),
  handleSingleUpload('image', 'categories'),
  applyUploadedFileToBody,
  createCategoryValidation,
  (req: Request, res: Response) => {
    return categoryController.createCategory(req, res)
  }
)

router.put(
  '/:id',
  checkPermissions(PERMISSION.UPDATE_CATEGORY),
  handleUpdateImageUpload('image', 'categories'),
  applyUploadedFileToBody,
  updateCategoryValidation,
  (req: Request, res: Response) => {
    return categoryController.updateCategory(req, res)
  }
)

router.delete(
  '/:id',
  checkPermissions(PERMISSION.DELETE_CATEGORY),
  (req: Request, res: Response) => {
    return categoryController.deleteCategory(req, res)
  }
)

export default router
