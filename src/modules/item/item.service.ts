import { DataSource, Repository } from 'typeorm';
import { Item } from './item.model';
import { Image } from '../image/image.model';
import { Category } from '../category/category.model';
import { ImageService } from '../image/image.service';

export class ItemService {
  constructor(private dataSource: DataSource, private imageService: ImageService) { }

  async createItem(payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const { category_id, imageKeys, ...itemData } = payload;
      let category = null;

      if (category_id) {
        category = await manager.findOneBy(Category, { id: category_id });
        if (!category) throw new Error('Category not found');
      }

      // Save initial item to DB to get its ID for file moving
      const newItem = manager.create(Item, { ...itemData, category } as any) as any as Item;
      const savedItem = await manager.save(Item, newItem) as any as Item;

      // Process image keys if any
      if (imageKeys && Array.isArray(imageKeys) && imageKeys.length > 0) {
        const destinationFolder = `products/${savedItem.id}`;
        const imgEntities: Image[] = [];

        for (const tKey of imageKeys) {
          try {
            const { url } = await this.imageService.moveTemporaryImage(tKey, destinationFolder);
            const imgEntity = manager.create(Image, { url, item: savedItem } as any) as any as Image;
            imgEntities.push(imgEntity);
          } catch (_error) {
            console.error(`Skipping image ${tKey} due to rename error`);
          }
        }

        if (imgEntities.length > 0) {
          await manager.save(Image, imgEntities);
        }
      }

      return await manager.findOne(Item, {
        where: { id: savedItem.id },
        relations: ['category', 'images'],
      });
    });
  }

  async getAllItems(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || parseInt(process.env.LIMIT_PAGE || '10');
    const skip = (page - 1) * limit;

    const [items, total] = await this.dataSource.getRepository(Item).findAndCount({
      // relations: ['category', 'images'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getItemById(id: string) {
    const item = await this.dataSource.getRepository(Item).findOne({
      where: { id },
      relations: ['category', 'images'],
    });
    if (!item) throw new Error('Item not found');
    return item;
  }

  async updateItem(id: string, payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(Item, {
        where: { id },
        relations: ['category', 'images'],
      });
      if (!item) throw new Error('Item not found');

      const { category_id, imageKeys, ...updateData } = payload;

      if (category_id !== undefined) {
        if (category_id) {
          const category = await manager.findOneBy(Category, { id: category_id });
          if (!category) throw new Error('Category not found');
          item.category = category;
        } else {
          (item as any).category = null;
        }
      }

      Object.assign(item, updateData);
      await manager.save(Item, item);

      // If new image keys came in, map and merge them
      if (imageKeys && Array.isArray(imageKeys) && imageKeys.length > 0) {
        const destinationFolder = `products/${item.id}`;
        const imgEntities: Image[] = [];

        for (const tKey of imageKeys) {
          try {
            const { url } = await this.imageService.moveTemporaryImage(tKey, destinationFolder);
            const imgEntity = manager.create(Image, { url, item } as any) as any as Image;
            imgEntities.push(imgEntity);
          } catch (_error) {
            console.error(`Skipping image ${tKey} due to rename error`);
          }
        }

        if (imgEntities.length > 0) {
          await manager.save(Image, imgEntities);
        }
      }

      return await manager.findOne(Item, {
        where: { id },
        relations: ['category', 'images'],
      });
    });
  }

  async deleteItem(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(Item, {
        where: { id },
        relations: ['category', 'images'],
      });
      if (!item) throw new Error('Item not found');

      await manager.softRemove(Item, item);
      return item;
    });
  }
}
