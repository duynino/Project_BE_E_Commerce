import { Request, Response } from 'express';
import { ItemService } from './item.service';
import { StatusCodes } from 'http-status-codes';

export class ItemController {
  private itemService: ItemService;

  constructor(itemService: ItemService) {
    this.itemService = itemService;
  }

  async createItem(req: Request, res: Response) {
    try {
      const newItem = await this.itemService.createItem(req.body);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Item created successfully', data: newItem });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getAllItems(req: Request, res: Response) {
    try {
      const { items, pagination } = await this.itemService.getAllItems(req.query);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Get items successfully', data: items, pagination });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getItemById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const item = await this.itemService.getItemById(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Item fetched successfully', data: item });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async updateItem(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const updatedItem = await this.itemService.updateItem(id, req.body);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Item updated successfully', data: updatedItem });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async deleteItem(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const deletedItem = await this.itemService.deleteItem(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Item deleted successfully', data: deletedItem });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }
}
