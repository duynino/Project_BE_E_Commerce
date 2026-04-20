import { v2 as cloudinary } from 'cloudinary';

export class ImageService {
  /**
   * Generates a signed authentication signature so the frontend can upload directly to Cloudinary.
   * Forces uploads into the `tmp` folder.
   */
  generateUploadSignature() {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'tmp';
    
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET as string
    );

    return {
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    };
  }

  /**
   * Moves an uploaded asset from the temporary folder to its permanent location.
   * @param temporaryPublicId - The public_id of the file in the tmp folder (e.g., "tmp/abcd123")
   * @param destinationFolder - The target folder (e.g., "products/uuid")
   * @returns The newly returned secure_url and public_id
   */
  async moveTemporaryImage(temporaryPublicId: string, destinationFolder: string): Promise<{ url: string; publicId: string }> {
    // Extract filename from the tmp publicId
    const filename = temporaryPublicId.split('/').pop();
    const newPublicId = `${destinationFolder}/${filename}`;

    try {
      const result = await cloudinary.uploader.rename(temporaryPublicId, newPublicId, {
        overwrite: true,
      });
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error(`Failed to move image ${temporaryPublicId} to ${newPublicId}:`, error);
      throw new Error(`Failed to process uploaded image. Invalid key or already moved.`);
    }
  }

  /**
   * Delete an asset from Cloudinary
   */
  async deleteImage(publicId: string) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error(`Failed to delete image ${publicId}:`, error);
    }
  }
}
