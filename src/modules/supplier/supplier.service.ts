import { DataSource } from 'typeorm';
import { Supplier } from './supplier.model';

export class SupplierService {
  constructor(private dataSource: DataSource) {}

  async createSupplier(payload: any) {
    const repository = this.dataSource.getRepository(Supplier);
    const newSupplier = repository.create(payload);
    return await repository.save(newSupplier);
  }

  async getAllSuppliers(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || parseInt(process.env.LIMIT_PAGE || '10');
    const skip = (page - 1) * limit;

    const [suppliers, total] = await this.dataSource.getRepository(Supplier).findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      suppliers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSupplierById(id: string) {
    const supplier = await this.dataSource.getRepository(Supplier).findOneBy({ id });
    if (!supplier) throw new Error('Supplier not found');
    return supplier;
  }

  async updateSupplier(id: string, payload: any) {
    const repository = this.dataSource.getRepository(Supplier);
    const supplier = await repository.findOneBy({ id });
    if (!supplier) throw new Error('Supplier not found');

    Object.assign(supplier, payload);
    return await repository.save(supplier);
  }

  async deleteSupplier(id: string) {
    const repository = this.dataSource.getRepository(Supplier);
    const supplier = await repository.findOneBy({ id });
    if (!supplier) throw new Error('Supplier not found');

    await repository.softRemove(supplier);
    return supplier;
  }
}
