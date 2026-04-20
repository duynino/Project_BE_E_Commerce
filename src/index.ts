import { Router } from 'express';
import userRoute from './modules/user/user.router';
import authRoute from './modules/auth/auth.router';
import roleRoute from './modules/role/role.router';
import permissionRoute from './modules/permission/permission.router';
import categoryRoute from './modules/category/category.router';
import itemRoute from './modules/item/item.router';
import imageRoute from './modules/image/image.router';

const router = Router();

router.use('/api/auth', authRoute);
router.use('/api/users', userRoute);
router.use('/api/roles', roleRoute);
router.use('/api/permissions', permissionRoute);
router.use('/api/categories', categoryRoute);
router.use('/api/items', itemRoute);
router.use('/api/images', imageRoute);

export default router;