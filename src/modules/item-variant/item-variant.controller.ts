import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ItemVariantService } from './item-variant.service';

export class ItemVariantController {
  constructor(private itemVariantService: ItemVariantService) {}

  async createItemVariant(req: Request, res: Response) {
    try {
      const variant = await this.itemVariantService.createItemVariant(req.body);
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: 'Item variant created successfully',
        data: variant
      });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: (error as Error).message
      });
    }
  }

  async getAllItemVariants(req: Request, res: Response) {
    try {
      const { variants, pagination } = await this.itemVariantService.getAllItemVariants(req.query);
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: 'Get item variants successfully',
        data: variants,
        pagination
      });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: (error as Error).message
      });
    }
  }

  async getItemVariantById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const variant = await this.itemVariantService.getItemVariantById(id);
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: 'Item variant fetched successfully',
        data: variant
      });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: (error as Error).message
      });
    }
  }

  async updateItemVariant(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const variant = await this.itemVariantService.updateItemVariant(id, req.body);
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: 'Item variant updated successfully',
        data: variant
      });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: (error as Error).message
      });
    }
  }

  async deleteItemVariant(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const variant = await this.itemVariantService.deleteItemVariant(id);
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: 'Item variant deleted successfully',
        data: variant
      });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: (error as Error).message
      });
    }
  }
}
