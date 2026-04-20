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
  unit?: string

  @Column({ type: 'int', nullable: true })
  quantity?: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight?: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchasePrice?: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice?: number

  @Column({ type: 'varchar', nullable: true })
  description?: string

  @Column({ type: 'varchar', nullable: true })
  createBy?: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn()
  deletedAt?: Date

  @OneToMany(() => Image, (image) => image.item)
  images!: Image[]

  @ManyToOne(() => Category, (category) => category.items, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'category_id' })
  category?: Category
}
