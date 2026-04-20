import { Router, Request, Response } from 'express'
import { PermissionController } from './permission.controller'
import { PermissionService } from './permission.service'
import { AppDataSource } from '~/config/db-config'
import { authenticate } from '~/middlewares/auth.middlewares'
import { checkPermissions } from '~/middlewares/auth.middlewares'
import PERMISSION from '~/constants/permission'

const router = Router()
const permissionService = new PermissionService(AppDataSource)
const permissionController = new PermissionController(permissionService)

router.use(authenticate)

router.post('/create', checkPermissions(PERMISSION.CREATE_PERMISSION), (req: Request, res: Response) => {
  return permissionController.createPermission(req, res)
})

router.get('/get-all', checkPermissions(PERMISSION.VIEW_PERMISSIONS), (req: Request, res: Response) => {
  return permissionController.getAllPermissions(req, res)
})

router.get('/:id', checkPermissions(PERMISSION.VIEW_PERMISSIONS), (req: Request, res: Response) => {
  return permissionController.getPermissionById(req, res)
})

router.put('/:id', checkPermissions(PERMISSION.UPDATE_PERMISSION), (req: Request, res: Response) => {
  return permissionController.updatePermission(req, res)
})

router.delete('/:id', checkPermissions(PERMISSION.DELETE_PERMISSION), (req: Request, res: Response) => {
  return permissionController.deletePermission(req, res)
})

export default router
