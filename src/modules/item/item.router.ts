import { Router, Request, Response } from 'express'
import { ItemController } from './item.controller'
import { ItemService } from './item.service'
import { AppDataSource } from '~/config/db-config'
import { authenticate, checkPermissions } from '~/middlewares/auth.middlewares'
import {
  handleMultipleUpload,
  applyUploadedFilesToBody
} from '~/middlewares/upload.middlewares'
import PERMISSION from '~/constants/permission'
import {
  createItemValidation,
  updateItemValidation
} from '~/validations/itemValidation'

const router = Router()
const itemService = new ItemService(AppDataSource)
const itemController = new ItemController(itemService)

router.get(
  '/get-all',
  (req: Request, res: Response) => {
    return itemController.getAllItems(req, res)
  }
)

router.get(
  '/:id',
  (req: Request, res: Response) => {
    return itemController.getItemById(req, res)
  }
)

router.use(authenticate)

router.post(
  '/create',
  checkPermissions(PERMISSION.CREATE_ITEM),
  handleMultipleUpload('images', 5, 'items'),
  applyUploadedFilesToBody,
  createItemValidation,
  (req: Request, res: Response) => {
    return itemController.createItem(req, res)
  }
)

router.put(
  '/:id',
  checkPermissions(PERMISSION.UPDATE_ITEM),
  updateItemValidation,
  (req: Request, res: Response) => {
    return itemController.updateItem(req, res)
  }
)

router.delete(
  '/:id',
  checkPermissions(PERMISSION.DELETE_ITEM),
  (req: Request, res: Response) => {
    return itemController.deleteItem(req, res)
  }
)

export default router
