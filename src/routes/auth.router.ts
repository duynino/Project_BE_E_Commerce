import { Router, Request, Response } from "express";
import { authRegisterValidation, authLoginValidation } from "../validations/authValidation";
import { AuthController } from "~/controllers/auth.controller";
import { AuthService } from "~/services/auth.service";
import { AppDataSource } from "~/config/db-config";

const router = Router();
const authService = new AuthService(AppDataSource);
const authController = new AuthController(authService);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký người dùng
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ (do authRegisterValidation)
 *       401:
 *         description: Sai email hoặc mật khẩu
 *       500:
 *         description: Lỗi hệ thống
 */
router.post("/register", authRegisterValidation, (req: Request, res: Response) => {
  return authController.register(req, res)
});


/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Xác minh email người dùng
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Email đã được xác minh
 *       400:
 *         description: Yêu cầu không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.get("/verify-email", (req: Request, res: Response) => {
  return authController.verifyEmail(req, res);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ (do authLoginValidation)
 *       401:
 *         description: Sai email hoặc mật khẩu
 *       500:
 *         description: Lỗi hệ thống
 */
router.post("/login", authLoginValidation, (req: Request, res: Response) => {
  return authController.login(req, res);
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất người dùng
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       400:
 *         description: Yêu cầu không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.post("/logout", (req: Request, res: Response) => {
  return authController.logout(req, res);
});

/**
 * @swagger
 * /api/auth/refresh-token:
 *  post:
 *    summary: Làm mới token
 *    tags: [Auth]
 *    responses:
 *     200:
 *      description: Token đã được làm mới thành công
 *     400:
 *      description: Yêu cầu không hợp lệ
 *     401:
 *      description: Token không hợp lệ hoặc đã hết hạn
 *     500:
 *      description: Lỗi hệ thống
 */
router.post("/refresh-token", (req: Request, res: Response) => {
  return authController.refreshToken(req, res);
});

/** 
 * @swagger
 * /api/auth/forgot-password:
 *  get:
 *    summary: Yêu cầu đặt lại mật khẩu
 *    tags: [Auth]
 *    responses:
 *     200:
 *      description: Yêu cầu đặt lại mật khẩu thành công
 *     400:
 *      description: Yêu cầu không hợp lệ
 *     500:
 *      description: Lỗi hệ thống
 */
router.get("/forgot-password", (req: Request, res: Response) => {
  return authController.forgotPassword(req, res);
});

/**
 * @swagger
 * /api/auth/reset-password:
 *  post:
 *    summary: Đặt lại mật khẩu
 *    tags: [Auth]
 *    responses:
 *     200:
 *      description: Đặt lại mật khẩu thành công
 *     400:
 *      description: Yêu cầu không hợp lệ
 *     500:
 *      description: Lỗi hệ thống
 */
router.post("/reset-password", (req: Request, res: Response) => {
  return authController.resetPassword(req, res);
});

/**
 * @swagger
 * /api/auth/change-password:
 *  post:
 *    summary: Thay đổi mật khẩu
 *    tags: [Auth]
 *    responses:
 *     200:
 *      description: Thay đổi mật khẩu thành công
 *     400:
 *      description: Yêu cầu không hợp lệ
 *     500:
 *      description: Lỗi hệ thống
 */
router.post("/change-password", (req: Request, res: Response) => {
  return authController.changePassword(req, res);
});
export default router;