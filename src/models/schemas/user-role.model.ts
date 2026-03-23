import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.model';
import { Role } from './role.model';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid'})
  userId?: string;

  @Column({ type: 'uuid'})
  roleId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Role)
  role!: Role;

  @ManyToOne(() => User)
  user!: User;
}