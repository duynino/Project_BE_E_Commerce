import { Request, Response } from 'express';
import { UserService } from './user.service';
import { StatusCodes } from 'http-status-codes';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  private buildUserPayload(req: Request) {
    const payload = { ...req.body } as Record<string, unknown>;
    const uploadedFile = (req as any).uploadedFile;

    if (uploadedFile?.url) {
      payload.publicId = uploadedFile.publicId;
      payload.avatarUrl = uploadedFile.url;
    }

    return payload;
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const { users, pagination } = await this.userService.getAllUsers(req.query);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Get users successfully', data: users, pagination });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getProfileUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id;
      const user = await this.userService.getUserById(userId);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Profile fetched successfully', data: user });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async updateProfileUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id;
      const updatedUser = await this.userService.updateUser(userId, req.body);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Profile updated successfully', data: updatedUser });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async updateAvatarUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id;
      const uploadedFile = (req as any).uploadedFile;
      if (!uploadedFile) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: 'No avatar uploaded' });
      }

      const updatedUser = await this.userService.updateUser(userId, { avatarUrl: uploadedFile.url, publicId: uploadedFile.publicId });
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Avatar updated successfully', data: updatedUser });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async sendInvitationUser(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: 'Email is required' });
      }
      const data = await this.userService.sendInvitationUser(email);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Invitation sent successfully', data });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const payload = this.buildUserPayload(req);
      const user = await this.userService.createUser(payload);
      return res.status(StatusCodes.CREATED).json({ status: StatusCodes.CREATED, message: 'User created successfully', data: user });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const user = await this.userService.getUserById(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'User fetched successfully', data: user });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const payload = this.buildUserPayload(req);
      const updatedUser = await this.userService.updateUser(id, payload);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'User updated successfully', data: updatedUser });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const deletedUser = await this.userService.deleteUser(id);
      return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'User deleted successfully', data: deletedUser });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: (error as Error).message });
    }
  }
}
