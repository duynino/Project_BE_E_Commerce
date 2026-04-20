import { Request, Response } from 'express';
import { CategoryService } from './category.service';
import { StatusCodes } from 'http-status-codes';

export class CategoryController {
  private categoryService: CategoryService;

  constructor(categoryService: CategoryService) {
    this.categoryService = categoryService;
  }

  async createCategory(req: Request, res: Response) {
    try {
      const newCategory = await this.categoryService.createCategory(req.body);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Category created successfully', data: newCategory });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getAllCategories(req: Request, res: Response) {
    try {
      const { categories, pagination } = await this.categoryService.getAllCategories(req.query);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Get categories successfully', data: categories, pagination });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const category = await this.categoryService.getCategoryById(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Category fetched successfully', data: category });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const updatedCategory = await this.categoryService.updateCategory(id, req.body);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Category updated successfully', data: updatedCategory });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const deletedCategory = await this.categoryService.deleteCategory(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Category deleted successfully', data: deletedCategory });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }
}
