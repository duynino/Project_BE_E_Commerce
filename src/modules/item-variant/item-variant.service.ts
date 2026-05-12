import { DataSource, EntityManager } from 'typeorm';
import { Item } from '../item/item.model';
import { ItemVariant } from './item-variant.model';

const ITEM_VARIANT_DETAIL_SELECT_FIELDS = [
  'variant.id',
  'variant.sku',
  'variant.stock',
  'variant.purchasePrice',
  'variant.salePrice',
  'variant.attributes',
  'variant.createdAt',
  'variant.updatedAt',
  'item.id',
  'item.name',
  'item.barcode',
  'item.thumbnail',
];

export class ItemVariantService {
  constructor(private dataSource: DataSource) {}

  private async resolveItem(itemId: string, manager: EntityManager) {
    const item = await manager.findOneBy(Item, { id: itemId });
    if (!item) {
      throw new Error('Item not found');
    }

    return item;
  }

  private async findItemVariantDetailById(id: string, manager: EntityManager = this.dataSource.manager) {
    return await manager
      .getRepository(ItemVariant)
      .createQueryBuilder('variant')
      .leftJoin('variant.item', 'item')
      .select(ITEM_VARIANT_DETAIL_SELECT_FIELDS)
      .where('variant.id = :id', { id })
      .getOne();
  }

  async createItemVariant(payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const item = await this.resolveItem(payload.item_id, manager);

      const variant = manager.create(ItemVariant, {
        item,
        sku: payload.sku,
        stock: payload.stock ?? 0,
        purchasePrice: payload.purchasePrice,
        salePrice: payload.salePrice,
        attributes: payload.attributes,
      } as ItemVariant);

      const savedVariant = await manager.save(ItemVariant, variant);
      return await this.findItemVariantDetailById(savedVariant.id, manager);
    });
  }

  async getAllItemVariants(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || parseInt(process.env.LIMIT_PAGE || '10');
    const skip = (page - 1) * limit;

    const qb = this.dataSource
      .getRepository(ItemVariant)
      .createQueryBuilder('variant')
      .leftJoin('variant.item', 'item')
      .select(ITEM_VARIANT_DETAIL_SELECT_FIELDS)
      .orderBy('variant.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.item_id) {
      qb.andWhere('item.id = :itemId', { itemId: query.item_id });
    }

    const [variants, total] = await qb.getManyAndCount();

    return {
      variants,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getItemVariantById(id: string) {
    const variant = await this.findItemVariantDetailById(id);
    if (!variant) {
      throw new Error('Item variant not found');
    }

    return variant;
  }

  async updateItemVariant(id: string, payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const variant = await manager.findOne(ItemVariant, {
        where: { id },
        relations: {
          item: true
        }
      });

      if (!variant) {
        throw new Error('Item variant not found');
      }

      if (payload.item_id !== undefined) {
        variant.item = await this.resolveItem(payload.item_id, manager);
      }

      if (payload.sku !== undefined) {
        variant.sku = payload.sku;
      }

      if (payload.stock !== undefined) {
        variant.stock = payload.stock;
      }

      if (payload.purchasePrice !== undefined) {
        variant.purchasePrice = payload.purchasePrice;
      }

      if (payload.salePrice !== undefined) {
        variant.salePrice = payload.salePrice;
      }

      if (payload.attributes !== undefined) {
        variant.attributes = payload.attributes;
      }

      await manager.save(ItemVariant, variant);
      return await this.findItemVariantDetailById(id, manager);
    });
  }

  async deleteItemVariant(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const variant = await manager.findOne(ItemVariant, {
        where: { id }
      });

      if (!variant) {
        throw new Error('Item variant not found');
      }

      await manager.softRemove(ItemVariant, variant);
      return variant;
    });
  }
}
