import { Router, Request, Response } from 'express'
import { CategoryController } from './category.controller'
import { CategoryService } from './category.service'
import { AppDataSource } from '~/config/db-config'
import { authenticate, checkPermissions } from '~/middlewares/auth.middlewares'
import PERMISSION from '~/constants/permission'
import { createCategoryValidation, updateCategoryValidation } from '~/validations/categoryValidation'

const router = Router()
const categoryService = new CategoryService(AppDataSource)
const categoryController = new CategoryController(categoryService)

router.use(authenticate)

router.post('/create', checkPermissions(PERMISSION.CREATE_CATEGORY), createCategoryValidation, (req: Request, res: Response) => {
  return categoryController.createCategory(req, res)
})

router.get('/get-all', checkPermissions(PERMISSION.VIEW_CATEGORIES), (req: Request, res: Response) => {
  return categoryController.getAllCategories(req, res)
})

router.get('/:id', checkPermissions(PERMISSION.VIEW_CATEGORY), (req: Request, res: Response) => {
  return categoryController.getCategoryById(req, res)
})

router.put('/:id', checkPermissions(PERMISSION.UPDATE_CATEGORY), updateCategoryValidation, (req: Request, res: Response) => {
  return categoryController.updateCategory(req, res)
})

router.delete('/:id', checkPermissions(PERMISSION.DELETE_CATEGORY), (req: Request, res: Response) => {
  return categoryController.deleteCategory(req, res)
})

export default router
