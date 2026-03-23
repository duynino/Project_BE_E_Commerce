import { Router } from 'express';
import userRoute  from './routes/user.router';
import authRoute  from './routes/auth.router';

const router = Router();

router.use('/api/auth', authRoute);
router.use('/api/users', userRoute);
export default router;