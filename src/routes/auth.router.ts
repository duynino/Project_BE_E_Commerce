import { Router, Request, Response } from "express";
import { authRegisterValidation } from "../validations/authValidation";
import { AuthController } from "~/controllers/auth.controller";
import { AuthService } from "~/services/auth.service";
import { AppDataSource } from "~/config/db-config";

const router = Router();
const authService = new AuthService(AppDataSource);
const authController = new AuthController(authService);

// Example route handlers
router.post("/register",authRegisterValidation, (req: Request, res: Response) => {
  return authController.register(req, res)
});


export default router;