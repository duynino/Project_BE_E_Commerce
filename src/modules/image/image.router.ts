import { Router, Request, Response } from 'express';
import { AppDataSource } from '~/config/db-config';
import PERMISSION from '~/constants/permission';
import { authenticate, checkPermissions } from '~/middlewares/auth.middlewares';
import { applyUploadedFileToBody, handleSingleUpload, handleUpdateImageUpload } from '~/middlewares/upload.middlewares';
import { createImageValidation, updateImageValidation } from '~/validations/imageValidation';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';

const router = Router();
const imageService = new ImageService(AppDataSource);
const imageController = new ImageController(imageService);

router.use(authenticate);

router.post('/create', checkPermissions(PERMISSION.CREATE_IMAGE), handleSingleUpload('image', 'images'), applyUploadedFileToBody, createImageValidation, (req: Request, res: Response) => {
  return imageController.createImage(req, res);
});

router.get('/get-all', checkPermissions(PERMISSION.VIEW_IMAGES), (req: Request, res: Response) => {
  return imageController.getAllImages(req, res);
});

router.get('/:id', checkPermissions(PERMISSION.VIEW_IMAGE), (req: Request, res: Response) => {
  return imageController.getImageById(req, res);
});

router.put('/:id', checkPermissions(PERMISSION.UPDATE_IMAGE), handleUpdateImageUpload('image', 'images'), applyUploadedFileToBody, updateImageValidation, (req: Request, res: Response) => {
  return imageController.updateImage(req, res);
});

router.delete('/:id', checkPermissions(PERMISSION.DELETE_IMAGE), (req: Request, res: Response) => {
  return imageController.deleteImage(req, res);
});

export default router;
