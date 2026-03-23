import {
  Entity, 
  PrimaryGeneratedColumn, 
  CreateDateColumn,
  ManyToOne,
} from 'typeorm'
import { Role } from './role.model'
import { Permission } from './permission.model'

@Entity('role_permissions')
export class RolePermission {
@PrimaryGeneratedColumn('uuid')
  id!: string

  @CreateDateColumn()
  createdAt!: Date

  @ManyToOne(() => Role)
  role!: Role

  @ManyToOne(() => Permission)
  permission!: Permission
}