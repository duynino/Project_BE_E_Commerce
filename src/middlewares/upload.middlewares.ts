import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { StatusCodes } from 'http-status-codes';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// ──────────────────────────────────────────────
// Multer — memory storage (buffer → Cloudinary stream)
// ──────────────────────────────────────────────
const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// ──────────────────────────────────────────────
// Cloudinary Upload Helper
// ──────────────────────────────────────────────
export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Upload a file buffer to Cloudinary via stream.
 * @param buffer   - File buffer from multer memoryStorage.
 * @param folder   - Cloudinary folder to organise assets (e.g. "products", "avatars").
 * @param publicId - Optional custom public_id; Cloudinary auto-generates one if omitted.
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  publicId?: string,
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const options: UploadApiOptions = {
      folder,
      resource_type: 'image',
      ...(publicId ? { public_id: publicId } : {}),
    };

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        return reject(error ?? new Error('Cloudinary upload failed'));
      }
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      });
    });

    stream.end(buffer);
  });
};

/**
 * Delete an asset from Cloudinary by its public_id.
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

// ──────────────────────────────────────────────
// Express middleware — single image upload
// Attaches `req.uploadedFile` after successful upload.
// ──────────────────────────────────────────────

/**
 * Middleware factory: parses a single image field, uploads it to Cloudinary,
 * and attaches the result to `req.uploadedFile`.
 *
 * @param fieldName - The form-data field name for the image (default: "image").
 * @param folder    - Cloudinary folder (default: "uploads").
 *
 * @example
 * router.post('/products', authenticate, handleSingleUpload('image', 'products'), createProduct);
 */
export const handleSingleUpload = (fieldName = 'image', folder = 'uploads') => {
  return [
    upload.single(fieldName),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.file) return next(); // No file — route handler decides whether it's required
        const result = await uploadToCloudinary(req.file.buffer, folder);
        (req as any).uploadedFile = result;
        next();
      } catch (error) {
        next(error);
      }
    },
  ];
};

/**
 * Middleware factory: parses multiple image fields, uploads them to Cloudinary,
 * and attaches the results array to `req.uploadedFiles`.
 *
 * @param fieldName - The form-data field name for files (default: "images").
 * @param maxCount  - Maximum number of files allowed (default: 10).
 * @param folder    - Cloudinary folder (default: "uploads").
 *
 * @example
 * router.post('/gallery', authenticate, handleMultipleUpload('images', 5, 'gallery'), createGallery);
 */
export const handleMultipleUpload = (fieldName = 'images', maxCount = 10, folder = 'uploads') => {
  return [
    upload.array(fieldName, maxCount),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) return next();

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

/**
 * Multer-specific error handler. Must be placed AFTER the route handler
 * in the middleware chain, or registered as a global error middleware.
 */
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
