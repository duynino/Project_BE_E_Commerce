import { DataSource } from "typeorm";
import { User } from "../models/schemas/user.model";
import { UserRole } from "~/models/schemas/user-role.model";
import { Role } from "~/models/schemas/role.model";
import Roles from "../constants/role";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { emailQueue } from "../utils/queue";
import { emailPayload } from "../interface/email.interface";

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

  async verifyEmail(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET || 'default_secret') as emailPayload;
      const user = await this.dataSource.getRepository(User).findOne({ where: { id: decoded.userId } });
      if (!user) throw new Error('User not found');
      if (user.isVerified) throw new Error('Email already verified');
      user.isVerified = true;
      await this.dataSource.getRepository(User).save(user);
     return { user: user, message: 'Email verified successfully' };
    } catch (error) {
      throw new Error(`Email verification failed: ${(error as Error).message}`);
    }
  }

  async loginUser(email: string, password: string) {
    const user = await this.dataSource.getRepository(User).findOne({ where: { email } });
    if (!user) throw new Error('Invalid email or password');
    if (!user.isVerified) throw new Error('Email not verified');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('Invalid email or password');

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
      { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await this.dataSource.getRepository(User).save(user);

    return { 
      accessToken, 
      refreshToken 
    };
  };

  async logoutUser(userId: string) {
    try {
      const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      user.refreshToken = '';
      await this.dataSource.getRepository(User).save(user);
      return { message: 'Logout successful' };
    } catch (error) {
      throw new Error(`Logout failed: ${(error as Error).message}`);
    }
  }

  async refreshToken(refreshToken: string) {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'default_refresh_secret') as emailPayload;
    const user = await this.dataSource.getRepository(User).findOne({ where: { id: decoded.userId } });
    if (!user || user.refreshToken !== refreshToken) throw new Error('Invalid refresh token');
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '15m' }
    );
    return { accessToken: newAccessToken };
  }

  async forgotPassword(email: string) {
    try {
      const user = await this.dataSource.getRepository(User).findOne({ where: { email } });
      if (!user) throw new Error('User not found');
      const forgotPasswordToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.PASSWORD_RESET_SECRET || 'default_password_reset_secret',
        { expiresIn: '10m' }
      );
      // Send password reset email logic would go here (omitted for brevity)
      await emailQueue.add('forgot-password', {
        email: user.email,
        token: forgotPasswordToken,
      });
    } catch (error) {
      throw new Error(`Forgot password process failed: ${(error as Error).message}`);
    }
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string) {
    try {
      const decoded = jwt.verify(token, process.env.PASSWORD_RESET_SECRET || 'default_password_reset_secret') as emailPayload;
      const user = await this.dataSource.getRepository(User).findOne({ where: { id: decoded.userId } });
      if (!user) throw new Error('User not found');
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
      const hashPassword = await bcrypt.hash(newPassword, Number(process.env.SALT || 10));
      user.password = hashPassword;
      await this.dataSource.getRepository(User).save(user);
      return { user: user, message: 'Password reset successful' };
    } catch (error) {
      throw new Error(`Password reset failed: ${(error as Error).message}`);
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string, confirmPassword: string) {
    try {
      const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) throw new Error('Invalid old password');
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
      const hashPassword = await bcrypt.hash(newPassword, Number(process.env.SALT || 10));
      user.password = hashPassword;
      await this.dataSource.getRepository(User).save(user);
      return { user: user, message: 'Password changed successfully' };
    } catch (error) {
      throw new Error(`Password change failed: ${(error as Error).message}`);
    }
  }
};

