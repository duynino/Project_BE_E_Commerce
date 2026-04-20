import { DataSource, Repository } from 'typeorm';
import { Category } from './category.model';

export class CategoryService {
  constructor(private dataSource: DataSource) { }

  async createCategory(payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const { parent_id, ...categoryData } = payload;
      let parent = null;
      if (parent_id) {
        parent = await manager.findOneBy(Category, { id: parent_id });
        if (!parent) throw new Error('Parent category not found');
      }

      const newCategory = manager.create(Category, { ...categoryData, parent });
      return await manager.save(Category, newCategory);
    });
  }

  async getAllCategories(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || parseInt(process.env.LIMIT_PAGE || '10');
    const skip = (page - 1) * limit;

    const [categories, total] = await this.dataSource.getRepository(Category).findAndCount({
      // relations: ['parent', 'children'],
      skip,
      take: limit,
      order: { position: 'ASC', createdAt: 'DESC' },
    });

    return {
      categories,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCategoryById(id: string) {
    const category = await this.dataSource.getRepository(Category).findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!category) throw new Error('Category not found');
    return category;
  }

  async updateCategory(id: string, payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const category = await manager.findOne(Category, {
        where: { id },
        relations: ['parent', 'children'],
      });
      if (!category) throw new Error('Category not found');

      const { parent_id, ...updateData } = payload;

      if (parent_id !== undefined) {
        if (parent_id) {
          const parent = await manager.findOneBy(Category, { id: parent_id });
          if (!parent) throw new Error('Parent category not found');
          if (parent.id === id) throw new Error('A category cannot be its own parent');
          category.parent = parent;
        } else {
          (category as any).parent = null;
        }
      }

      Object.assign(category, updateData);
      return await manager.save(Category, category);
    });
  }

  async deleteCategory(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const category = await manager.findOne(Category, {
        where: { id },
        relations: ['parent', 'children'],
      });
      if (!category) throw new Error('Category not found');

      await manager.softRemove(Category, category);
      return category;
    });
  }
}
