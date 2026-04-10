import { Router, Request, Response } from 'express'
import { RoleController } from '~/controllers/role.controller'
import { RoleService } from '~/services/role.service'
import { AppDataSource } from '~/config/db-config'
import { authenticate } from '~/middlewares/auth.middlewares'
import { checkPermissions } from '~/middlewares/auth.middlewares'
import PERMISSION from '~/constants/permission'

const router = Router()
const roleService = new RoleService(AppDataSource)
const roleController = new RoleController(roleService)

/**
 * @swagger
 * /api/role:
 *   post:
 *     summary: Tạo role mới
 *     tags: [Role]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "admin"
 *     responses:
 *       200:
 *         description: Role đã được tạo thành công
 *       400:
 *         description: Yêu cầu không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.use(authenticate)

router.post('/create', checkPermissions(PERMISSION.CREATE_ROLE), (req: Request, res: Response) => {
  return roleController.createRole(req, res)
})

router.get('/get-all', checkPermissions(PERMISSION.VIEW_ROLES), (req: Request, res: Response) => {
  return roleController.getAllRoles(req, res)
})

router.get('/:id', checkPermissions(PERMISSION.VIEW_ROLES), (req: Request, res: Response) => {
  return roleController.getRoleById(req, res)
})

router.put('/:id', checkPermissions(PERMISSION.UPDATE_ROLE), (req: Request, res: Response) => {
  return roleController.updateRole(req, res)
})

router.delete('/:id', checkPermissions(PERMISSION.DELETE_ROLE), (req: Request, res: Response) => {
  return roleController.deleteRole(req, res)
})
export default router
