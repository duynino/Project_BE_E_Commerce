import { Brackets, DataSource, EntityManager } from 'typeorm';
import { Image } from './image.model';
import { Item } from '../item/item.model';
import { deleteFromCloudinary } from '~/middlewares/upload.middlewares';

export class ImageService {
  constructor(private dataSource?: DataSource) {}

  async createImage(payload: any) {
    if (!payload.url) {
      throw new Error('Image url is required');
    }

    return await this.getDataSource().transaction(async (manager) => {
      const item = await this.resolveItem(payload.item_id, manager);
      const image = manager.create(Image, {
        url: payload.url,
        publicId: payload.publicId || null,
        name: item ? `Ảnh của ${item.name}` : null,
        item,
      } as any);

      const savedImage = await manager.save(Image, image);
      return await manager.createQueryBuilder(Image, 'image')
        .leftJoin('image.item', 'item')
        .select([
          'image.id',
          'image.name',
          'image.url',
          'image.publicId',
          'image.createdAt',
          'item.id',
          'item.name',
        ])
        .where('image.id = :id', { id: savedImage.id })
        .getOne();
    });
  }

  async getAllImages(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || parseInt(process.env.LIMIT_PAGE || '10');
    const skip = (page - 1) * limit;

    const queryBuilder = this.getDataSource()
      .getRepository(Image)
      .createQueryBuilder('image')
      .leftJoin('image.item', 'item')
      .select([
        'image.id',
        'image.name',
        'image.url',
        'image.publicId',
        'image.createdAt',
        'item.id',
        'item.name',
      ])
      .orderBy('image.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.item_id) {
      queryBuilder.andWhere('item.id = :itemId', { itemId: query.item_id });
    }

    if (query.search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('image.url ILIKE :search', { search: `%${query.search}%` }).orWhere('image.publicId ILIKE :search', {
            search: `%${query.search}%`,
          });
        }),
      );
    }

    const [images, total] = await queryBuilder.getManyAndCount();

    return {
      images,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getImageById(id: string) {
    const image = await this.getDataSource().getRepository(Image)
      .createQueryBuilder('image')
      .leftJoin('image.item', 'item')
      .select([
        'image.id',
        'image.name',
        'image.url',
        'image.publicId',
        'image.createdAt',
        'item.id',
        'item.name',
      ])
      .where('image.id = :id', { id })
      .getOne();

    if (!image) {
      throw new Error('Image not found');
    }

    return image;
  }

  async updateImage(id: string, payload: any) {
    return await this.getDataSource().transaction(async (manager) => {
      const image = await manager.findOne(Image, {
        where: { id },
        select: { id: true, url: true, publicId: true },
      });

      if (!image) {
        throw new Error('Image not found');
      }

      if (payload.url !== undefined) {
        image.url = payload.url;
      }

      if (payload.publicId !== undefined) {
        image.publicId = payload.publicId || null;
      }

      if (payload.item_id !== undefined) {
        image.item = await this.resolveItem(payload.item_id, manager) as any;
        if (image.item) {
          image.name = `Ảnh của ${(image.item as any).name}`;
        }
      }

      await manager.save(Image, image);

      return await manager.createQueryBuilder(Image, 'image')
        .leftJoin('image.item', 'item')
        .select([
          'image.id',
          'image.name',
          'image.url',
          'image.publicId',
          'image.createdAt',
          'item.id',
          'item.name',
        ])
        .where('image.id = :id', { id: image.id })
        .getOne();
    });
  }

  async deleteImageRecord(id: string) {
    const image = await this.getDataSource().transaction(async (manager) => {
      const foundImage = await manager.findOne(Image, {
        where: { id },
        select: { id: true, publicId: true, url: true },
      });

      if (!foundImage) {
        throw new Error('Image not found');
      }

      await manager.softRemove(Image, foundImage);
      return foundImage;
    });

    if (image.publicId) {
      await this.safeDeleteFromCloudinary(image.publicId);
    }

    return image;
  }

  private async resolveItem(itemId?: string | null, manager?: EntityManager) {
    if (!itemId) {
      return null;
    }

    const item = manager
      ? await manager.findOneBy(Item, { id: itemId })
      : await this.getDataSource().getRepository(Item).findOneBy({ id: itemId });

    if (!item) {
      throw new Error('Item not found');
    }

    return item;
  }

  private async safeDeleteFromCloudinary(publicId: string) {
    try {
      await deleteFromCloudinary(publicId);
    } catch (error) {
      console.error(`Failed to delete image ${publicId}:`, error);
    }
  }

  private getDataSource() {
    if (!this.dataSource) {
      throw new Error('DataSource is required for image CRUD operations');
    }

    return this.dataSource;
  }
}
