import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Item } from '../item/item.model'

@Entity('item_variants')
export class ItemVariant {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Item, (item) => item.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item!: Item

  @Column({ type: 'json', nullable: true })
  attributes?: Record<string, string>

  @Column({ type: 'varchar', nullable: true })
  sku?: string

  @Column({ type: 'int', default: 0 })
  stock!: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchasePrice?: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice?: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
