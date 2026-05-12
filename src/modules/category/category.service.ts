import { DataSource } from 'typeorm';
import { Category } from './category.model';

export class CategoryService {
  constructor(private dataSource: DataSource) { }

  private categoryBaseSelect(alias: string) {
    return [
      `${alias}.id`,
      `${alias}.name`,
      `${alias}.position`,
      `${alias}.bannerImage`,
      `${alias}.status`,
      `${alias}.createdAt`,
      `${alias}.updatedAt`,
    ];
  }

  private async findCategoryDetailById(id: string, manager = this.dataSource.manager) {
    return await manager
      .getRepository(Category)
      .createQueryBuilder('category')
      .leftJoin('category.parent', 'parent')
      .leftJoin('category.children', 'children')
      .select(this.categoryBaseSelect('category'))
      .addSelect(['parent.id', 'parent.name', 'parent.position', 'parent.bannerImage', 'parent.status'])
      .addSelect(['children.id', 'children.name', 'children.position', 'children.bannerImage', 'children.status'])
      .where('category.id = :id', { id })
      .orderBy('children.position', 'ASC')
      .addOrderBy('children.createdAt', 'DESC')
      .getOne();
  }

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

    const qb = this.dataSource
      .getRepository(Category)
      .createQueryBuilder('category')
      .leftJoin('category.children', 'children')
      .select(this.categoryBaseSelect('category'))
      .addSelect(['children.id', 'children.name', 'children.position'])
      .orderBy('category.position', 'ASC')
      .addOrderBy('category.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [categories, total] = await qb.getManyAndCount();

    return {
      categories,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCategoryById(id: string) {
    const category = await this.findCategoryDetailById(id);
    if (!category) throw new Error('Category not found');
    return category;
  }

  async updateCategory(id: string, payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const category = await manager.findOne(Category, {
        where: { id },
        select: {
          id: true,
          name: true,
          position: true,
          bannerImage: true,
          status: true,
        },
      });
      if (!category) throw new Error('Category not found');

      const { parent_id, ...updateData } = payload;

      if (parent_id !== undefined) {
        if (parent_id) {
          const parent = await manager.findOne(Category, {
            where: { id: parent_id },
            select: { id: true },
          });
          if (!parent) throw new Error('Parent category not found');
          if (parent.id === id) throw new Error('A category cannot be its own parent');
          category.parent = parent as Category;
        } else {
          (category as any).parent = null;
        }
      }

      Object.assign(category, updateData);
      await manager.save(Category, category);

      const updatedCategory = await this.findCategoryDetailById(id, manager);
      if (!updatedCategory) throw new Error('Category not found');
      return updatedCategory;
    });
  }

  async deleteCategory(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const category = await this.findCategoryDetailById(id, manager);
      if (!category) throw new Error('Category not found');

      await manager.softDelete(Category, { id });
      return category;
    });
  }
}
