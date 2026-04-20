import { Router, Request, Response } from 'express'
import { ItemController } from './item.controller'
import { ItemService } from './item.service'
import { ImageService } from '../image/image.service'
import { AppDataSource } from '~/config/db-config'
import { authenticate, checkPermissions } from '~/middlewares/auth.middlewares'
import PERMISSION from '~/constants/permission'
import { createItemValidation, updateItemValidation } from '~/validations/itemValidation'

const router = Router()
const imageService = new ImageService()
const itemService = new ItemService(AppDataSource, imageService)
const itemController = new ItemController(itemService)

router.use(authenticate)

router.post('/create', checkPermissions(PERMISSION.CREATE_ITEM), createItemValidation, (req: Request, res: Response) => {
  return itemController.createItem(req, res)
})

router.get('/get-all', checkPermissions(PERMISSION.VIEW_ITEMS), (req: Request, res: Response) => {
  return itemController.getAllItems(req, res)
})

router.get('/:id', checkPermissions(PERMISSION.VIEW_ITEM), (req: Request, res: Response) => {
  return itemController.getItemById(req, res)
})

router.put('/:id', checkPermissions(PERMISSION.UPDATE_ITEM), updateItemValidation, (req: Request, res: Response) => {
  return itemController.updateItem(req, res)
})

router.delete('/:id', checkPermissions(PERMISSION.DELETE_ITEM), (req: Request, res: Response) => {
  return itemController.deleteItem(req, res)
})

export default router
