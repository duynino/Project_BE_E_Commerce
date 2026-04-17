import { DataSource, Like } from 'typeorm'
import { Permission } from '~/models/schemas/permission.model'
import { RolePermission } from '~/models/schemas/role-permission.model'

export class PermissionService {
  constructor(private readonly dataSource: DataSource) {}

  async createPermission(data: { name: string, description?: string, createBy?: string }) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const permission = await manager.findOne(Permission, { where: { name: data.name } })
        if (permission) throw new Error('Permission already exists')
        const newPermission = manager.create(Permission, data)
        await manager.save(newPermission)
        return newPermission
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
      const permission = await this.dataSource.getRepository(Permission).findOne({ where: { id } })
      if (!permission) throw new Error('Permission not found')
      return permission
    } catch (error) {
      throw new Error(`Failed to get permission by id: ${(error as Error).message}`)
    }
  }

  async updatePermission(id: string, data: { name?: string, description?: string }) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const permission = await manager.findOne(Permission, { where: { id } })
        if (!permission) throw new Error('Permission not found')
        if (data.name) permission.name = data.name
        if (data.description !== undefined) permission.description = data.description
        await manager.save(permission)
        return permission
      })
    } catch (error) {
      throw new Error(`Failed to update permission: ${(error as Error).message}`)
    }
  }

  async deletePermission(id: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const permission = await manager.findOne(Permission, { where: { id } })
        if (!permission) throw new Error('Permission not found')
        // Xóa cứng role_permission liên quan (nếu có cascade thì TypeORM tự xử lý)
        await manager.delete(RolePermission, { permissionId: id })
        await manager.remove(permission)
        return permission
      })
    } catch (error) {
      throw new Error(`Failed to delete permission: ${(error as Error).message}`)
    }
  }
}
