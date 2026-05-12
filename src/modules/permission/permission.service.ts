import { DataSource, Like } from 'typeorm'
import { Permission } from './permission.model'
import { RolePermission } from '~/modules/role-permission/role-permission.model'
import { FindOptionsSelect } from 'typeorm'

const PERMISSION_SELECT_FIELDS: FindOptionsSelect<Permission> = {
  id: true,
  name: true,
  description: true,
  createBy: true,
  createdAt: true,
  updatedAt: true,
}

const PERMISSION_ID_SELECT: FindOptionsSelect<Permission> = {
  id: true,
}

export class PermissionService {
  constructor(private readonly dataSource: DataSource) { }

  async createPermission(data: { name: string, description?: string, createBy?: string }) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const permission = await manager.findOne(Permission, { where: { name: data.name }, select: PERMISSION_ID_SELECT })
        if (permission) throw new Error('Permission already exists')
        const newPermission = manager.create(Permission, data)
        const savedPermission = await manager.save(newPermission)
        return await manager.findOne(Permission, { where: { id: savedPermission.id }, select: PERMISSION_SELECT_FIELDS })
      })
    } catch (error) {
      throw new Error(`Failed to create permission: ${(error as Error).message}`)
    }
  }

  async getAllPermissions(data: any) {
    try {
      const { page = 1, sortBy = 'id', order = 'ASC', filter, pageSize, search } = data
      const currentPage = Math.max(Number(page) || 1, 1)
      const currentPageSize = Math.max(Number(pageSize) || Number(process.env.LIMIT_PAGE) || 10, 1)
      const offset = (currentPage - 1) * currentPageSize
      const where: any = {}

      if (typeof search === 'string' && search.trim()) {
        where.name = Like(`%${search.trim()}%`)
      }

      if (filter && typeof filter === 'object') {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            where[key] = value
          }
        })
      }

      const queries: any = {
        where,
        skip: offset,
        take: currentPageSize,
        order: { [sortBy]: (order as string).toUpperCase() },
        select: PERMISSION_SELECT_FIELDS,
      }

      const [permissions, total] = await this.dataSource.getRepository(Permission).findAndCount(queries)
      return {
        permissions,
        pagination: {
          page: currentPage,
          pageSize: currentPageSize,
          total,
          totalPages: Math.ceil(total / currentPageSize),
        },
      }
    } catch (error) {
      throw new Error(`Failed to get all permissions: ${(error as Error).message}`)
    }
  }

  async getPermissionById(id: string) {
    try {
      const permission = await this.dataSource.getRepository(Permission).findOne({ where: { id }, select: PERMISSION_SELECT_FIELDS })
      if (!permission) throw new Error('Permission not found')
      return permission
    } catch (error) {
      throw new Error(`Failed to get permission by id: ${(error as Error).message}`)
    }
  }

  async updatePermission(id: string, data: { name?: string, description?: string }) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const permission = await manager.findOne(Permission, { where: { id }, select: PERMISSION_ID_SELECT })
        if (!permission) throw new Error('Permission not found')

        const updateData: any = {}
        if (data.name) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description

        if (Object.keys(updateData).length > 0) {
          await manager.update(Permission, { id }, updateData)
        }

        return await manager.findOne(Permission, { where: { id }, select: PERMISSION_SELECT_FIELDS })
      })
    } catch (error) {
      throw new Error(`Failed to update permission: ${(error as Error).message}`)
    }
  }

  async deletePermission(id: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const permission = await manager.findOne(Permission, { where: { id }, select: PERMISSION_SELECT_FIELDS })
        if (!permission) throw new Error('Permission not found')
        // Xóa cứng role_permission liên quan (nếu có cascade thì TypeORM tự xử lý)
        await manager.delete(RolePermission, { permissionId: id })
        await manager.delete(Permission, { id })
        return permission
      })
    } catch (error) {
      throw new Error(`Failed to delete permission: ${(error as Error).message}`)
    }
  }
}
