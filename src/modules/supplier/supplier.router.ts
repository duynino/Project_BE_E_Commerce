import { Router, Request, Response } from 'express'
import { SupplierController } from './supplier.controller'
import { SupplierService } from './supplier.service'
import { AppDataSource } from '~/config/db-config'
import { authenticate, checkPermissions } from '~/middlewares/auth.middlewares'
import {
  handleUpdateImageUpload,
  handleSingleUpload,
  applyUploadedFileToBody
} from '~/middlewares/upload.middlewares'
import PERMISSION from '~/constants/permission'
import {
  createSupplierValidation,
  updateSupplierValidation
} from '~/validations/supplierValidation'

const router = Router()
const supplierService = new SupplierService(AppDataSource)
const supplierController = new SupplierController(supplierService)

router.get(
  '/get-all',
  (req: Request, res: Response) => {
    return supplierController.getAllSuppliers(req, res)
  }
)

router.get(
  '/:id',
  (req: Request, res: Response) => {
    return supplierController.getSupplierById(req, res)
  }
)

router.use(authenticate)

router.post(
  '/create',
  checkPermissions(PERMISSION.CREATE_SUPPLIER),
  handleSingleUpload('logo', 'suppliers'),
  applyUploadedFileToBody,
  createSupplierValidation,
  (req: Request, res: Response) => {
    return supplierController.createSupplier(req, res)
  }
)

router.put(
  '/:id',
  checkPermissions(PERMISSION.UPDATE_SUPPLIER),
  handleUpdateImageUpload('logo', 'suppliers'),
  applyUploadedFileToBody,
  updateSupplierValidation,
  (req: Request, res: Response) => {
    return supplierController.updateSupplier(req, res)
  }
)

router.delete(
  '/:id',
  checkPermissions(PERMISSION.DELETE_SUPPLIER),
  (req: Request, res: Response) => {
    return supplierController.deleteSupplier(req, res)
  }
)

export default router
