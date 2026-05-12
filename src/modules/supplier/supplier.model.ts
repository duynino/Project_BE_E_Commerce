import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm'
import { Item } from '../item/item.model'

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  companyName!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string

  @Column({ type: 'varchar', nullable: true })
  logoUrl?: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn()
  deletedAt?: Date

  @OneToMany(() => Item, (item) => item.supplier)
  items!: Item[]
}
