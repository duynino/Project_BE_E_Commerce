import { Router, Request, Response } from 'express';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { authenticate } from '~/middlewares/auth.middlewares';

const router = Router();
const imageService = new ImageService();
const imageController = new ImageController(imageService);

router.use(authenticate);

router.get('/signature', (req: Request, res: Response) => {
  return imageController.getUploadSignature(req, res);
});



export default router;
