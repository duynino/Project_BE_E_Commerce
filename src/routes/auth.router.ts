import { Router, Request, Response } from "express";
import { authRegisterValidation, authLoginValidation } from "../validations/authValidation";
import { AuthController } from "~/controllers/auth.controller";
import { AuthService } from "~/services/auth.service";
import { AppDataSource } from "~/config/db-config";

const router = Router();
const authService = new AuthService(AppDataSource);
const authController = new AuthController(authService);


router.post("/register", authRegisterValidation, (req: Request, res: Response) => {
  return authController.register(req, res)
});


router.get("/verify-email", (req: Request, res: Response) => {
  return authController.verifyEmail(req, res);
});

router.post("/login", authLoginValidation, (req: Request, res: Response) => {
  return authController.login(req, res);
});

router.post("/logout", (req: Request, res: Response) => {
  return authController.logout(req, res);
});

router.post("/refresh-token", (req: Request, res: Response) => {
  return authController.refreshToken(req, res);
});

router.get("/forgot-password", (req: Request, res: Response) => {
  return authController.forgotPassword(req, res);
});

router.post("/reset-password", (req: Request, res: Response) => {
  return authController.resetPassword(req, res);
});

router.post("/change-password", (req: Request, res: Response) => {
  return authController.changePassword(req, res);
});
export default router;