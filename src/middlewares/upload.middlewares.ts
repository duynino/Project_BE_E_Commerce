import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { StatusCodes } from 'http-status-codes';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const CLOUDINARY_FOLDERS = {
  AVATAR: 'vmo/avatar',
  CATEGORY: 'vmo/category',
  PRODUCT: 'vmo/product',
  UPLOADS: 'vmo/uploads',
} as const;

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(
    new Error(
      `Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
    ),
  );
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string = CLOUDINARY_FOLDERS.UPLOADS,
  publicId?: string,
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const options: UploadApiOptions = {
      folder,
      resource_type: 'image',
      ...(publicId ? { public_id: publicId } : {}),
    };

    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      },
    );

    stream.end(buffer);
  });
};

export const deleteFromCloudinary = async (
  publicId: string,
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const handleSingleUpload = (
  fieldName = 'image',
  folder: string = CLOUDINARY_FOLDERS.UPLOADS,
) => {
  return [
    upload.single(fieldName),

    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          return next();
        }

        const result = await uploadToCloudinary(req.file.buffer, folder);

        (req as any).uploadedFile = result;

        next();
      } catch (error) {
        next(error);
      }
    },
  ];
};

export const handleMultipleUpload = (
  fieldName = 'images',
  maxCount = 10,
  folder: string = CLOUDINARY_FOLDERS.UPLOADS,
) => {
  return [
    upload.array(fieldName, maxCount),

    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          return next();
        }

        const results = await Promise.all(
          files.map((file) => uploadToCloudinary(file.buffer, folder)),
        );

        (req as any).uploadedFiles = results;

        next();
      } catch (error) {
        next(error);
      }
    },
  ];
};

export const handleUpdateImageUpload = (
  fieldName = 'image',
  folder: string = CLOUDINARY_FOLDERS.UPLOADS,
  getOldPublicId: (req: Request) => string | undefined = (req) =>
    req.body?.oldPublicId || req.body?.publicId,
) => {
  return [
    upload.single(fieldName),

    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          return next();
        }

        const oldPublicId = getOldPublicId(req);

        const uploaded = await uploadToCloudinary(
          req.file.buffer,
          folder,
        );

        if (oldPublicId) {
          try {
            await deleteFromCloudinary(oldPublicId);
          } catch {
            // Old asset cleanup is best-effort only.
          }
        }

        (req as any).uploadedFile = uploaded;

        next();
      } catch (error) {
        next(error);
      }
    },
  ];
};

export const applyUploadedFileToBody = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const uploadedFile = (req as any).uploadedFile;

  if (uploadedFile?.url) {
    req.body = {
      ...req.body,
      image: uploadedFile.url,
      imagePublicId: uploadedFile.publicId,
    };
  }

  next();
};

export const applyUploadedFilesToBody = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const uploadedFiles = (req as any).uploadedFiles as
    | CloudinaryUploadResult[]
    | undefined;

  if (uploadedFiles?.length) {
    req.body = {
      ...req.body,
      images: uploadedFiles.map((file) => file.url),
      imagePublicIds: uploadedFiles.map((file) => file.publicId),
    };
  }

  next();
};

export const handleUploadError = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
      LIMIT_UNEXPECTED_FILE: 'Unexpected field name for file upload.',
      LIMIT_FILE_COUNT: 'Too many files uploaded.',
    };

    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: messages[error.code] ?? error.message,
    });
  }

  if (error instanceof Error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: error.message,
    });
  }

  next(error);
};