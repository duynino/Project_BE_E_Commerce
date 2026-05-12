import { Request, Response, Router } from 'express';
import PERMISSION from '~/constants/permission';
import { AppDataSource } from '~/config/db-config';
import { authenticate, checkPermissions } from '~/middlewares/auth.middlewares';
import { createItemVariantValidation, updateItemVariantValidation } from '~/validations/itemVariantValidation';
import { ItemVariantController } from './item-variant.controller';
import { ItemVariantService } from './item-variant.service';

const router = Router();
const itemVariantService = new ItemVariantService(AppDataSource);
const itemVariantController = new ItemVariantController(itemVariantService);

router.use(authenticate);

router.post('/create', checkPermissions(PERMISSION.CREATE_ITEM_VARIANT), createItemVariantValidation, (req: Request, res: Response) => {
  return itemVariantController.createItemVariant(req, res);
});

router.get('/get-all', checkPermissions(PERMISSION.VIEW_ITEM_VARIANTS), (req: Request, res: Response) => {
  return itemVariantController.getAllItemVariants(req, res);
});

router.get('/:id', checkPermissions(PERMISSION.VIEW_ITEM_VARIANT), (req: Request, res: Response) => {
  return itemVariantController.getItemVariantById(req, res);
});

router.put('/:id', checkPermissions(PERMISSION.UPDATE_ITEM_VARIANT), updateItemVariantValidation, (req: Request, res: Response) => {
  return itemVariantController.updateItemVariant(req, res);
});

router.delete('/:id', checkPermissions(PERMISSION.DELETE_ITEM_VARIANT), (req: Request, res: Response) => {
  return itemVariantController.deleteItemVariant(req, res);
});

export default router;
