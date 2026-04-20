import { DataSource, FindOptionsSelect } from 'typeorm';
import { User } from './user.model';
import { ImageService } from '../image/image.service';
import bcrypt from 'bcrypt';

const USER_SELECT_FIELDS: FindOptionsSelect<User> = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  gender: true,
  age: true,
  phoneNumber: true,
  dateOfBirth: true,
  address: true,
  avatarUrl: true,
  isVerified: true,
  createdAt: true,
};

export class UserService {
  constructor(private dataSource: DataSource, private imageService: ImageService) { }

  private sanitizeCreatePayload(payload: any) {
    return {
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      gender: payload.gender,
      age: payload.age,
      phoneNumber: payload.phoneNumber,
      dateOfBirth: payload.dateOfBirth,
      address: payload.address,
      avatarUrl: payload.avatarUrl,
    };
  }

  private sanitizeUpdatePayload(payload: any) {
    return {
      firstName: payload.firstName,
      lastName: payload.lastName,
      gender: payload.gender,
      age: payload.age,
      phoneNumber: payload.phoneNumber,
      dateOfBirth: payload.dateOfBirth,
      address: payload.address,
      avatarUrl: payload.avatarUrl,
      avatarKey: payload.avatarKey,
    };
  }

  async getAllUsers(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || parseInt(process.env.LIMIT_PAGE || '10');
    const skip = (page - 1) * limit;

    const [users, total] = await this.dataSource.getRepository(User).findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: USER_SELECT_FIELDS,
    });

    return {
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserById(id: string) {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id },
      select: USER_SELECT_FIELDS,
    });
    if (!user) throw new Error('User not found');
    return user;
  }

  async createUser(payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const userPayload = this.sanitizeCreatePayload(payload);
      const existingUser = await manager.findOne(User, { where: { email: userPayload.email } });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userPayload.password, salt);

      const user = new User();
      Object.assign(user, userPayload);
      user.password = hashedPassword;

      await manager.save(User, user);

      return await manager.findOne(User, {
        where: { id: user.id },
        select: USER_SELECT_FIELDS,
      });
    });
  }

  async updateUser(id: string, payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id } });
      if (!user) throw new Error('User not found');

      const { avatarKey, ...updateData } = this.sanitizeUpdatePayload(payload);
      Object.assign(user, updateData);

      if (avatarKey && typeof avatarKey === 'string') {
        try {
          const { url } = await this.imageService.moveTemporaryImage(avatarKey, `avatars/${user.id}`);
          user.avatarUrl = url;
        } catch (_error) {
          console.error(`Skipping avatar move for ${avatarKey} due to rename error`);
        }
      }

      await manager.save(User, user);

      return await manager.findOne(User, {
        where: { id },
        select: USER_SELECT_FIELDS,
      });
    });
  }

  async deleteUser(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id } });
      if (!user) throw new Error('User not found');

      await manager.softRemove(User, user);
      return { id: user.id };
    });
  }

  async sendInvitationUser(email: string) {
    // NOTE: Implement actual email sending logic here
    return {
      message: `Invitation successfully initiated for ${email}.`
    };
  }
}
