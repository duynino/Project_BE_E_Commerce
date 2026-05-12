import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { Image } from '../image/image.model'
import { Category } from '../category/category.model'
import { Supplier } from '../supplier/supplier.model'
import { ItemVariant } from '~/modules/item-variant/item-variant.model'

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  barcode?: string

  @Column({ type: 'varchar', nullable: true })
  thumbnail?: string

  @Column({ type: 'varchar', nullable: true })
  description?: string

  @Column({ type: 'varchar', nullable: true })
  createBy?: string

  @OneToMany(() => Image, (image) => image.item)
  images!: Image[]

  @ManyToOne(() => Category, (category) => category.items, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'category_id' })
  category?: Category

  @Column({ type: 'varchar', nullable: true })
  categoryName?: string

  @ManyToOne(() => Supplier, (supplier) => supplier.items, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Supplier

  @Column({ type: 'varchar', nullable: true })
  supplierName?: string

  @OneToMany(() => ItemVariant, (variant) => variant.item)
  variants!: ItemVariant[]

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
