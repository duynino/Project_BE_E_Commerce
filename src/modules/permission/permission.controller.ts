import { Request, Response } from "express";
import { PermissionService } from "./permission.service";
import { StatusCodes } from "http-status-codes";

export class PermissionController {
  private permissionService: PermissionService;
  constructor(permissionService: PermissionService) {
    this.permissionService = permissionService;
  }

  async createPermission(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      const createBy = req.user?.userId;
      const newPermission = await this.permissionService.createPermission({ name, description, createBy });
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Permission created successfully', data: newPermission });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getAllPermissions(req: Request, res: Response) {
    try {
      const permissions = await this.permissionService.getAllPermissions(req.body as { [key: string]: unknown });
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Permissions fetched successfully', data: permissions });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getPermissionById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const permission = await this.permissionService.getPermissionById(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Permission fetched successfully', data: permission });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async updatePermission(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const { name, description } = req.body;
      const updatedPermission = await this.permissionService.updatePermission(id, { name, description });
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Permission updated successfully', data: updatedPermission });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async deletePermission(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const deletedPermission = await this.permissionService.deletePermission(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Permission deleted successfully', data: deletedPermission });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }
}
