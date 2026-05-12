import { DataSource } from 'typeorm';
import { Item } from './item.model';
import { Image } from '../image/image.model';
import { Category } from '../category/category.model';
import { Supplier } from '../supplier/supplier.model';
import { FindOptionsSelect } from 'typeorm';

const ITEM_COMPACT_SELECT: FindOptionsSelect<Item> = {
  id: true,
  name: true,
  barcode: true,
  thumbnail: true,
  categoryName: true,
  supplierName: true,
  createdAt: true,
  updatedAt: true,
};

const ITEM_DETAIL_SELECT_FIELDS = [
  'item.id',
  'item.name',
  'item.barcode',
  'item.thumbnail',
  'item.categoryName',
  'item.supplierName',
  'item.description',
  'item.createBy',
  'item.createdAt',
  'item.updatedAt',
  'category.id',
  'images.id',
  'images.url',
  'images.publicId',
  'images.name',
  'supplier.id',
  'variants.id',
  'variants.sku',
  'variants.stock',
  'variants.purchasePrice',
  'variants.salePrice',
  'variants.attributes',
  'variants.createdAt',
  'variants.updatedAt',
];

const ITEM_ID_SELECT: FindOptionsSelect<Item> = {
  id: true,
};

export class ItemService {
  constructor(private dataSource: DataSource) { }

  private async findItemDetailById(id: string, manager = this.dataSource.manager) {
    return await manager.createQueryBuilder(Item, 'item')
      .leftJoin('item.category', 'category')
      .leftJoin('item.images', 'images')
      .leftJoin('item.supplier', 'supplier')
      .leftJoin('item.variants', 'variants')
      .select(ITEM_DETAIL_SELECT_FIELDS)
      .where('item.id = :id', { id })
      .orderBy('variants.createdAt', 'ASC')
      .getOne();
  }

  async createItem(payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const { category_id, supplier_id, uploadedFiles, ...itemData } = payload;
      let category = null;
      let supplier = null;

      if (category_id) {
        category = await manager.findOneBy(Category, { id: category_id });
        if (!category) throw new Error('Category not found');
      }

      if (supplier_id) {
        supplier = await manager.findOneBy(Supplier, { id: supplier_id });
        if (!supplier) throw new Error('Supplier not found');
      }

      // Handle thumbnail if files were uploaded and no thumbnail is provided
      if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
        if (!itemData.thumbnail) {
          itemData.thumbnail = uploadedFiles[0].url;
        }
      }

      // Save initial item to DB
      const newItem = manager.create(Item, { 
        ...itemData, 
        category, 
        supplier,
        categoryName: category?.name,
        supplierName: supplier?.companyName
      } as any) as any as Item;
      const savedItem = await manager.save(Item, newItem) as any as Item;

      // Process uploaded files
      if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
        const imgEntities = uploadedFiles.map((file: any) => 
          manager.create(Image, { 
            url: file.url, 
            publicId: file.publicId, 
            name: `Ảnh của ${savedItem.name}`,
            item: savedItem 
          } as any) as any as Image
        );

        if (imgEntities.length > 0) {
          await manager.save(Image, imgEntities);
        }
      }

      return await this.findItemDetailById(savedItem.id, manager);
    });
  }

  async getAllItems(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || parseInt(process.env.LIMIT_PAGE || '10');
    const skip = (page - 1) * limit;

    const [items, total] = await this.dataSource.getRepository(Item).findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: ITEM_COMPACT_SELECT,
    });

    return {
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getItemById(id: string) {
    const item = await this.findItemDetailById(id);
    if (!item) throw new Error('Item not found');
    return item;
  }

  async updateItem(id: string, payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(Item, {
        where: { id },
        select: ITEM_ID_SELECT,
      });
      if (!item) throw new Error('Item not found');

      const { category_id, supplier_id, ...updateData } = payload;

      if (category_id !== undefined) {
        if (category_id) {
          const category = await manager.findOneBy(Category, { id: category_id });
          if (!category) throw new Error('Category not found');
          item.category = category;
          item.categoryName = category.name;
        } else {
          item.category = null as any;
          item.categoryName = null as any;
        }
      }

      if (supplier_id !== undefined) {
        if (supplier_id) {
          const supplier = await manager.findOneBy(Supplier, { id: supplier_id });
          if (!supplier) throw new Error('Supplier not found');
          item.supplier = supplier;
          item.supplierName = supplier.companyName;
        } else {
          item.supplier = null as any;
          item.supplierName = null as any;
        }
      }

      Object.assign(item, updateData);
      await manager.save(Item, item);

      return await this.findItemDetailById(id, manager);
    });
  }

  async deleteItem(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(Item, {
        where: { id },
        select: ITEM_ID_SELECT,
      });
      if (!item) throw new Error('Item not found');

      await manager.softRemove(Item, item);
      return item;
    });
  }
}
