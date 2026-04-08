import { Router } from 'express';
import userRoute  from './routes/user.router';
import authRoute  from './routes/auth.router';
import roleRoute from './routes/role.router';
import permissionRoute from './routes/permission.router';

const router = Router();

router.use('/api/auth', authRoute);
router.use('/api/users', userRoute);
router.use('/api/roles', roleRoute);
router.use('/api/permissions', permissionRoute);
export default router;