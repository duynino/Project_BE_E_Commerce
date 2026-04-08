import { Request, Response } from "express";
import { RoleService } from "~/services/role.service";
import { StatusCodes } from "http-status-codes";

export class RoleController {
  private roleService: RoleService;
  constructor(roleService: RoleService) {
    this.roleService = roleService;
  }

  async createRole(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      const createBy = req.user?.userId;
      const newRole = await this.roleService.createRole({ name, description, createBy });
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Role created successfully', data: newRole });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getAllRoles(req: Request, res: Response) {
    try {
      const roles = await this.roleService.getAllRoles(req.body);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Roles fetched successfully', data: roles });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getRoleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const role = await this.roleService.getRoleById(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Role fetched successfully', data: role });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const updatedRole = await this.roleService.updateRole(id, name);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Role updated successfully', data: updatedRole });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedRole = await this.roleService.deleteRole(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Role deleted successfully', data: deletedRole });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }
}
