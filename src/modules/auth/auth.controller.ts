import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { StatusCodes } from 'http-status-codes';
import User from '~/interface/user.interface';

export class AuthController {
  private authService: AuthService;
  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const newUser = await this.authService.registerUser(email, password);
      return res.status(200).json({ status: StatusCodes.OK, message: 'User registered successfully', data: newUser });
    } catch (error) {
      return res.status(400).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;
      if (typeof token !== 'string') {
        return res.status(400).json({ status: StatusCodes.BAD_REQUEST, message: 'Invalid token' });
      }
      const result = await this.authService.verifyEmail(token);
      return res.status(200).json({ status: StatusCodes.OK, message: result.message, data: result.user });
    } catch (error) {
      return res.status(400).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.loginUser(email, password);
      return res.status(200).json({ status: StatusCodes.OK, message: 'Login successful', data: result });
    } catch (error) {
      return res.status(400).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  };

  async logout(req: Request, res: Response) {
    try {
      const { user } = req.body as { user: User };

      const result = await this.authService.logoutUser(user.id);
      return res.status(200).json({ status: StatusCodes.OK, message: result.message });
    } catch (error) {
      return res.status(400).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }

  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      return res.status(200).json({ status: StatusCodes.OK, message: 'Token refreshed successfully', data: result });
    } catch (error) {
      return res.status(400).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      await this.authService.forgotPassword(email);
      return res.status(200).json({ status: StatusCodes.OK, message: 'Password reset email sent successfully' });
    } catch (error) {
      return res.status(400).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      const result = await this.authService.resetPassword(token, newPassword, confirmPassword);
      return res.status(200).json({ status: StatusCodes.OK, message: result.message, data: result.user });
    } catch (error) {
      return res.status(400).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const { user, oldPassword, newPassword, confirmPassword } = req.body;
      const result = await this.authService.changePassword(user.id, oldPassword, newPassword, confirmPassword);
      return res.status(200).json({ status: StatusCodes.OK, message: result.message, data: result.user });
    } catch (error) {
      return res.status(400).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }
}