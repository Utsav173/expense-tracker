/**
 * Processes a user-uploaded image file to create a square, resized, and compressed profile picture.
 *
 * @param {File} file The image file to process.
 * @param {number} targetSize The desired output width and height in pixels.
 * @param {number} quality The JPEG compression quality (0 to 1).
 * @returns {Promise<string>} A Promise that resolves with the base64 encoded string of the processed image.
 */
export const processProfileImage = (
  file: File,
  targetSize: number = 256,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Failed to get canvas context.'));
        }

        canvas.width = targetSize;
        canvas.height = targetSize;

        const sourceWidth = img.width;
        const sourceHeight = img.height;
        let sx = 0;
        let sy = 0;
        let sWidth = sourceWidth;
        let sHeight = sourceHeight;

        // --- Logic to crop the image into a square from the center ---
        if (sourceWidth > sourceHeight) {
          sWidth = sourceHeight;
          sx = (sourceWidth - sourceHeight) / 2;
        } else if (sourceHeight > sourceWidth) {
          sHeight = sourceWidth;
          sy = (sourceHeight - sourceWidth) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetSize, targetSize);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = (error) => {
        reject(new Error(`Image loading failed: ${error}`));
      };

      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error('Failed to read file.'));
      }
    };

    reader.onerror = (error) => {
      reject(new Error(`File reading failed: ${error}`));
    };

    reader.readAsDataURL(file);
  });
};
