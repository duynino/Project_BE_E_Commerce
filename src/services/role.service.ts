import { DataSource, Like } from 'typeorm'
import { Role } from '~/models/schemas/role.model'

export class RoleService {
  constructor(private readonly dataSource: DataSource) {}

  async createRole(data: { name: string, description: string, createBy: string }) {
    try {
      const role = await this.dataSource.getRepository(Role).findOne({ where: { name: data.name } })
      if (role) throw new Error('Role already exists')
      const newRole = this.dataSource.getRepository(Role).create(data)
      await this.dataSource.getRepository(Role).save(newRole)
      return newRole
    } catch (error) {
      throw new Error(`Failed to create role: ${(error as Error).message}`)
    }
  }

  async getAllRoles(data: any) {
    try {
      const { page, sortBy, order, pageSize, search } = data
      const offset = page <= 1 ? 0 : (page - 1) * Number(process.env.LIMIT_PAGE)
      const limit = Number(pageSize) || Number(process.env.LIMIT_PAGE) || 10
      const where: any = {}
      if (search) {
        where.name = Like(`%${search}%`)
      }
      const queries = {
        where,
        skip: offset,
        take: limit,
        order: {
          [sortBy]: order
        }
      }
      
      const [roles, total] = await this.dataSource.getRepository(Role).findAndCount(queries)
      return { roles, total }
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
      const role = await this.dataSource.getRepository(Role).findOne({ where: { id } })
      if (!role) throw new Error('Role not found')
      role.name = name
      await this.dataSource.getRepository(Role).save(role)
      return role
    } catch (error) {
      throw new Error(`Failed to update role: ${(error as Error).message}`)
    }
  }

  async deleteRole(id: string) {
    try {
      const role = await this.dataSource.getRepository(Role).findOne({ where: { id } })
      if (!role) throw new Error('Role not found')
      await this.dataSource.getRepository(Role).remove(role)
      return role
    } catch (error) {
      throw new Error(`Failed to delete role: ${(error as Error).message}`)
    }
  }
}
