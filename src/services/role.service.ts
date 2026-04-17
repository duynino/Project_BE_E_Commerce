import { DataSource, Like } from 'typeorm'
import { Role } from '~/models/schemas/role.model'

export class RoleService {
  constructor(private readonly dataSource: DataSource) {}

  async createRole(data: { name: string; description: string; createBy: string }) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const role = await manager.findOne(Role, { where: { name: data.name } })
        if (role) throw new Error('Role already exists')
        const newRole = manager.create(Role, data)
        await manager.save(newRole)
        return newRole
      })
    } catch (error) {
      throw new Error(`Failed to create role: ${(error as Error).message}`)
    }
  }

  async getAllRoles(data: any) {
    try {
      const { page = 1, sortBy = 'id', order = 'ASC', pageSize, search } = data
      const currentPage = Math.max(Number(page) || 1, 1)
      const currentPageSize = Math.max(Number(pageSize) || Number(process.env.LIMIT_PAGE) || 10, 1)
      const offset = (currentPage - 1) * currentPageSize
      const where: any = {}
      if (typeof search === 'string' && search.trim()) {
        where.name = Like(`%${search.trim()}%`)
      }
      const queries = {
        where,
        skip: offset,
        take: currentPageSize,
        order: {
          [sortBy as string]: (order as string).toUpperCase()
        }
      }

      const [roles, total] = await this.dataSource.getRepository(Role).findAndCount(queries)
      return {
        roles,
        pagination: {
          page: currentPage,
          pageSize: currentPageSize,
          total,
          totalPages: Math.ceil(total / currentPageSize)
        }
      }
    } catch (error) {
      throw new Error(`Failed to get all roles: ${(error as Error).message}`)
    }
  }

  async getRoleById(id: string) {
    try {
      const role = await this.dataSource.getRepository(Role).findOne({ where: { id } })
      if (!role) throw new Error('Role not found')
      return role
    } catch (error) {
      throw new Error(`Failed to get role by id: ${(error as Error).message}`)
    }
  }

  async updateRole(id: string, name: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const role = await manager.findOne(Role, { where: { id } })
        if (!role) throw new Error('Role not found')
        role.name = name
        await manager.save(role)
        return role
      })
    } catch (error) {
      throw new Error(`Failed to update role: ${(error as Error).message}`)
    }
  }

  async deleteRole(id: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const role = await manager.findOne(Role, { where: { id } })
        if (!role) throw new Error('Role not found')
        await manager.remove(role)
        return role
      })
    } catch (error) {
      throw new Error(`Failed to delete role: ${(error as Error).message}`)
    }
  }
}
