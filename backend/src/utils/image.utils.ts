import sharp from 'sharp';
import { HTTPException } from 'hono/http-exception';

/**
 * Compresses an image buffer using Sharp.
 * Resizes to fit within 250x250, converts to WebP with quality 80.
 * Throws HTTPException if input is invalid, format unsupported, or compressed size exceeds 2MB.
 * @param imageData - The image data object (expected to have arrayBuffer method, like BunFile).
 * @returns Object with { error: boolean, data: string (base64 data URL or error message) }.
 */
export async function compressImage(imageData: any): Promise<{ error: boolean; data: string }> {
  try {
    if (!imageData || typeof imageData.arrayBuffer !== 'function') {
      console.error('compressImage: Invalid image data object provided.');
      throw new HTTPException(400, { message: 'Invalid image data provided.' });
    }

    const buffer = await imageData.arrayBuffer();
    if (!buffer || buffer.byteLength === 0) {
      console.error('compressImage: Empty image buffer received.');
      throw new HTTPException(400, { message: 'Empty image buffer received.' });
    }

    const sharpInstance = sharp(Buffer.from(buffer));
    const metadata = await sharpInstance.metadata();
    const format = metadata.format;

    const allowedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'avif', 'tiff'];
    if (!format || !allowedFormats.includes(format)) {
      console.error(
        `compressImage: Invalid image format: ${format}. Allowed: ${allowedFormats.join(', ')}.`,
      );
      throw new HTTPException(400, {
        message: `Invalid image format: ${format}. Allowed: ${allowedFormats.join(', ')}.`,
      });
    }

    const reducedFile = await sharpInstance
      .resize(250, 250, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const sizeInMB = reducedFile.length / (1024 * 1024);
    const sizeLimitMB = 2;

    if (sizeInMB > sizeLimitMB) {
      console.error(
        `compressImage: Image size (${sizeInMB.toFixed(
          2,
        )}MB) exceeds ${sizeLimitMB}MB limit after compression.`,
      );
      throw new HTTPException(413, {
        message: `Image size exceeds ${sizeLimitMB}MB limit after compression.`,
      });
    }

    return {
      error: false,
      data: `data:image/webp;base64,${reducedFile.toString('base64')}`,
    };
  } catch (error: any) {
    console.error('Image compression error:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: `Image processing failed: ${error.message}` });
  }
}
