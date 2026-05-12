import { DataSource, FindOptionsSelect } from 'typeorm';
import { User } from './user.model';
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
  updatedAt: true,
};

const USER_ID_SELECT: FindOptionsSelect<User> = {
  id: true,
};

const GENDER_CODE_BY_VALUE: Record<string, number> = {
  prefer_not_to_say: 0,
  male: 1,
  female: 2,
  other: 3,
};

const normalizeGender = (value: unknown) => {
  if (typeof value === 'string') {
    return GENDER_CODE_BY_VALUE[value] ?? undefined;
  }

  return value;
};

export class UserService {
  constructor(private dataSource: DataSource) { }

  private sanitizeCreatePayload(payload: any) {
    return {
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      gender: normalizeGender(payload.gender),
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
      gender: normalizeGender(payload.gender),
      age: payload.age,
      phoneNumber: payload.phoneNumber,
      dateOfBirth: payload.dateOfBirth,
      address: payload.address,
      avatarUrl: payload.avatarUrl,
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
      const existingUser = await manager.findOne(User, {
        where: { email: userPayload.email },
        select: USER_ID_SELECT,
      });
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
      const user = await manager.findOne(User, {
        where: { id },
        select: USER_ID_SELECT,
      });
      if (!user) throw new Error('User not found');

      const updateData = Object.fromEntries(
        Object.entries(this.sanitizeUpdatePayload(payload)).filter(([, value]) => value !== undefined),
      );

      if (Object.keys(updateData).length > 0) {
        await manager.update(User, { id }, updateData);
      }

      return await manager.findOne(User, {
        where: { id },
        select: USER_SELECT_FIELDS,
      });
    });
  }

  async deleteUser(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id },
        select: USER_ID_SELECT,
      });
      if (!user) throw new Error('User not found');

      await manager.softDelete(User, { id });
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
