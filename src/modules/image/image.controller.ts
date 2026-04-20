import { Request, Response } from 'express';
import { ImageService } from './image.service';
import { StatusCodes } from 'http-status-codes';

export class ImageController {
  private imageService: ImageService;

  constructor(imageService: ImageService) {
    this.imageService = imageService;
  }

  getUploadSignature(req: Request, res: Response) {
    try {
      const signatureData = this.imageService.generateUploadSignature();
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: 'Upload signature generated successfully',
        data: signatureData,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: (error as Error).message,
      });
    }
  }
}
