import { Request, Response } from 'express';
import { SupplierService } from './supplier.service';
import { StatusCodes } from 'http-status-codes';

export class SupplierController {
  private supplierService: SupplierService;

  constructor(supplierService: SupplierService) {
    this.supplierService = supplierService;
  }

  async createSupplier(req: Request, res: Response) {
    try {
      const payload = {
        ...req.body,
        logoUrl: (req as any).uploadedFile?.url || req.body.logoUrl,
      };
      const newSupplier = await this.supplierService.createSupplier(payload);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Supplier created successfully', data: newSupplier });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getAllSuppliers(req: Request, res: Response) {
    try {
      const { suppliers, pagination } = await this.supplierService.getAllSuppliers(req.query);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Get suppliers successfully', data: suppliers, pagination });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getSupplierById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const supplier = await this.supplierService.getSupplierById(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Supplier fetched successfully', data: supplier });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const payload = {
        ...req.body,
        logoUrl: (req as any).uploadedFile?.url || req.body.logoUrl,
      };
      const updatedSupplier = await this.supplierService.updateSupplier(id, payload);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Supplier updated successfully', data: updatedSupplier });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const deletedSupplier = await this.supplierService.deleteSupplier(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Supplier deleted successfully', data: deletedSupplier });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }
}
