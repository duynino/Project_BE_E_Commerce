import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ImageService } from './image.service';

export class ImageController {
  private imageService: ImageService;

  constructor(imageService: ImageService) {
    this.imageService = imageService;
  }

  private buildImagePayload(req: Request) {
    const payload = { ...req.body } as Record<string, unknown>;
    const uploadedFile = (req as any).uploadedFile;

    if (uploadedFile?.url) {
      payload.url = uploadedFile.url;
      payload.publicId = uploadedFile.publicId;
    }

    return payload;
  }

  async createImage(req: Request, res: Response) {
    try {
      const image = await this.imageService.createImage(this.buildImagePayload(req));
      return res.status(StatusCodes.CREATED).json({
        status: StatusCodes.CREATED,
        message: 'Image created successfully',
        data: image,
      });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: (error as Error).message,
      });
    }
  }

  async getAllImages(req: Request, res: Response) {
    try {
      const { images, pagination } = await this.imageService.getAllImages(req.query);
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: 'Get images successfully',
        data: images,
        pagination,
      });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: (error as Error).message,
      });
    }
  }

  async getImageById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const image = await this.imageService.getImageById(id);
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: 'Image fetched successfully',
        data: image,
      });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: (error as Error).message,
      });
    }
  }

  async updateImage(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const image = await this.imageService.updateImage(id, this.buildImagePayload(req));
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: 'Image updated successfully',
        data: image,
      });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: (error as Error).message,
      });
    }
  }

  async deleteImage(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const image = await this.imageService.deleteImageRecord(id);
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: 'Image deleted successfully',
        data: image,
      });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: (error as Error).message,
      });
    }
  }
}
