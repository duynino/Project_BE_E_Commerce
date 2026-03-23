import { DataSource, Repository } from "typeorm";
import { User } from "../models/schemas/user.model";
import { UserRole } from "~/models/schemas/user-role.model";
import { Role } from "~/models/schemas/role.model";
import Roles from "../constants/role";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { emailQueue } from "../utils/queue";

export class AuthService {
  constructor(private readonly dataSource: DataSource) {}

  async registerUser(email: string, password: string) {
    return await this.dataSource.transaction(async (manager) => {
      const hashPassword = await bcrypt.hash(password, Number(process.env.SALT || 10));

      const checkUser = await manager.findOne(User, { where: { email } });
      if (checkUser) throw new Error('Email already in use');

      const newUser = manager.create(User, { email, password: hashPassword });
      await manager.save(newUser);

      const role = await manager.findOne(Role, {
        where: { name: Roles.STUDENT },
      });

      await manager.save(UserRole, {
        userId: newUser.id,
        roleId: role!.id,
      });

      const emailVerificationToken = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.EMAIL_VERIFICATION_SECRET || 'default_secret',
        { expiresIn: '1d' }
      );

      // Send verification email logic would go here (omitted for brevity)
      await emailQueue.add('verify-email', {
        email: newUser.email,
        token: emailVerificationToken,
      });
      return { emailVerificationToken };
    });
  };

  
};

