import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm'
import { Item } from '../item/item.model'

@Entity('categories')
export class Category {
  @Index()
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'int', nullable: true })
  position?: number

  @Column({ type: 'varchar', nullable: true })
  bannerImage?: string

  @Column({ type: 'varchar', nullable: true })
  status?: string

  // 🔥 MANY TO ONE (child → parent)
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category | null;

  // 🔥 ONE TO MANY (parent → children)
  @OneToMany(() => Category, (category) => category.parent)
  children!: Category[];

  @OneToMany(() => Item, (item) => item.category)
  items!: Item[];
  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
