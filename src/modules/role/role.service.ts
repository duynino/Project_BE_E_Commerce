import { DataSource, FindOptionsSelect, Like } from 'typeorm';
import { Role } from './role.model';

const ROLE_SELECT_FIELDS: FindOptionsSelect<Role> = {
  id: true,
  name: true,
  description: true,
  createBy: true,
  createdAt: true,
  updatedAt: true,
};

const ROLE_ID_SELECT: FindOptionsSelect<Role> = {
  id: true,
};

export class RoleService {
  constructor(private readonly dataSource: DataSource) {}

  async createRole(data: { name: string; description: string; createBy: string }) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const role = await manager.findOne(Role, {
          where: { name: data.name },
          select: ROLE_ID_SELECT,
        });
        if (role) throw new Error('Role already exists');

        const newRole = manager.create(Role, data);
        const savedRole = await manager.save(Role, newRole);

        return await manager.findOne(Role, {
          where: { id: savedRole.id },
          select: ROLE_SELECT_FIELDS,
        });
      });
    } catch (error) {
      throw new Error(`Failed to create role: ${(error as Error).message}`);
    }
  }

  async getAllRoles(data: any) {
    try {
      const { page = 1, sortBy = 'id', order = 'ASC', pageSize, search } = data;
      const currentPage = Math.max(Number(page) || 1, 1);
      const currentPageSize = Math.max(Number(pageSize) || Number(process.env.LIMIT_PAGE) || 10, 1);
      const offset = (currentPage - 1) * currentPageSize;
      const where: any = {};

      if (typeof search === 'string' && search.trim()) {
        where.name = Like(`%${search.trim()}%`);
      }

      const [roles, total] = await this.dataSource.getRepository(Role).findAndCount({
        where,
        skip: offset,
        take: currentPageSize,
        order: {
          [sortBy as string]: (order as string).toUpperCase(),
        },
        select: ROLE_SELECT_FIELDS,
      });

      return {
        roles,
        pagination: {
          page: currentPage,
          pageSize: currentPageSize,
          total,
          totalPages: Math.ceil(total / currentPageSize),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get all roles: ${(error as Error).message}`);
    }
  }

  async getRoleById(id: string) {
    try {
      const role = await this.dataSource.getRepository(Role).findOne({
        where: { id },
        select: ROLE_SELECT_FIELDS,
      });
      if (!role) throw new Error('Role not found');
      return role;
    } catch (error) {
      throw new Error(`Failed to get role by id: ${(error as Error).message}`);
    }
  }

  async updateRole(id: string, name: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const role = await manager.findOne(Role, {
          where: { id },
          select: ROLE_ID_SELECT,
        });
        if (!role) throw new Error('Role not found');

        await manager.update(Role, { id }, { name });

        return await manager.findOne(Role, {
          where: { id },
          select: ROLE_SELECT_FIELDS,
        });
      });
    } catch (error) {
      throw new Error(`Failed to update role: ${(error as Error).message}`);
    }
  }

  async deleteRole(id: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const role = await manager.findOne(Role, {
          where: { id },
          select: ROLE_SELECT_FIELDS,
        });
        if (!role) throw new Error('Role not found');

        await manager.delete(Role, { id });
        return role;
      });
    } catch (error) {
      throw new Error(`Failed to delete role: ${(error as Error).message}`);
    }
  }
}
