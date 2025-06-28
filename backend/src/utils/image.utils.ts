import { Jimp } from 'jimp';
import { HTTPException } from 'hono/http-exception';

/**
 * Compresses an image buffer using Jimp.
 * Resizes to fit within 250x250, converts to JPEG with quality 80.
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

    // Load image with Jimp
    const image = await Jimp.fromBuffer(Buffer.from(buffer));

    // Get original format info
    const mimeType = image.mime;
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
    ];

    if (!allowedMimeTypes.includes(mimeType!)) {
      console.error(
        `compressImage: Invalid image format: ${mimeType}. Allowed: ${allowedMimeTypes.join(
          ', ',
        )}.`,
      );
      throw new HTTPException(400, {
        message: `Invalid image format: ${mimeType}. Allowed: ${allowedMimeTypes.join(', ')}.`,
      });
    }

    // Resize image to fit within 250x250 while maintaining aspect ratio
    image.scaleToFit({ w: 250, h: 250 });

    // Set quality to 80 and get buffer
    // Note: Jimp doesn't support WebP output natively, so we'll use JPEG with quality 80
    // If WebP is specifically needed, you might need to use a different library or sharp
    const compressedBuffer = await image.getBuffer('image/jpeg', { quality: 80 });

    const sizeInMB = compressedBuffer.length / (1024 * 1024);
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
      data: `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`,
    };
  } catch (error: any) {
    console.error('Image compression error:', error);

    // Handle Jimp-specific errors
    if (error.message && error.message.includes('Could not find MIME')) {
      throw new HTTPException(400, { message: 'Unsupported image format.' });
    }

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: `Image processing failed: ${error.message}` });
  }
}
