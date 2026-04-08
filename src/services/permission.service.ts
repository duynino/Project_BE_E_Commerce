import { DataSource, Like } from 'typeorm'
import { Permission } from '~/models/schemas/permission.model'

export class PermissionService {
  constructor(private readonly dataSource: DataSource) {}

  async createPermission(data: { name: string, description?: string, createBy?: string }) {
    try {
      const permission = await this.dataSource.getRepository(Permission).findOne({ where: { name: data.name } })
      if (permission) throw new Error('Permission already exists')
      const newPermission = this.dataSource.getRepository(Permission).create(data)
      await this.dataSource.getRepository(Permission).save(newPermission)
      return newPermission
    } catch (error) {
      throw new Error(`Failed to create permission: ${(error as Error).message}`)
    }
  }

  async getAllPermissions(data: any) {
    try {
      const { page, sortBy, order,filter, pageSize, search } = data
      const offset = page <= 1 ? 0 : (page - 1) * Number(process.env.LIMIT_PAGE)
      const limit = Number(pageSize) || Number(process.env.LIMIT_PAGE) || 10
      const where: any = {}
      if (search) {
        where.name = Like(`%${search}%`)
      }
      
      const queries: any = {
        where,
        skip: offset,
        take: limit
      }
      
      if (sortBy) {
        queries.order = {
          [sortBy]: order
        }
      }

      if (filter && typeof filter === "object") {
       Object.entries(filter).forEach(([key, value]) => {
        if (value) {
          where[key] = value
        }
       })
      }
      
      const [permissions, total] = await this.dataSource.getRepository(Permission).findAndCount(queries)
      return { permissions, total }
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
      const permission = await this.dataSource.getRepository(Permission).findOne({ where: { id } })
      if (!permission) throw new Error('Permission not found')
      if (data.name) permission.name = data.name
      if (data.description !== undefined) permission.description = data.description
      await this.dataSource.getRepository(Permission).save(permission)
      return permission
    } catch (error) {
      throw new Error(`Failed to update permission: ${(error as Error).message}`)
    }
  }

  async deletePermission(id: string) {
    try {
      const permission = await this.dataSource.getRepository(Permission).findOne({ where: { id } })
      if (!permission) throw new Error('Permission not found')
      await this.dataSource.getRepository(Permission).remove(permission)
      return permission
    } catch (error) {
      throw new Error(`Failed to delete permission: ${(error as Error).message}`)
    }
  }
}
