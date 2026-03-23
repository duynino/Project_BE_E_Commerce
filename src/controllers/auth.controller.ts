import { Request, Response } from 'express';
import { AuthService } from '~/services/auth.service';

export class AuthController {
  private authService: AuthService;
  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async register(req: Request, res: Response) {
    try{
      const { email, password } = req.body;
      const newUser = await this.authService.registerUser(email, password);
      return res.status(200).json({ message: 'User registered successfully', data: newUser });
    }catch(error){
      return res.status(400).json({ message: (error as Error).message });
    }
  }
}