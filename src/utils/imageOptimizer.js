/**
 * Mobile Image Optimization Utility
 * Handles image compression and optimization for mobile uploads
 */

/**
 * Compress image before upload (optional, for very large files)
 * Uses Canvas API to resize and re-encode image
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width in pixels (default 2000)
 * @param {number} maxHeight - Maximum height in pixels (default 2000)
 * @param {number} quality - JPEG quality 0-1 (default 0.8)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, maxWidth = 2000, maxHeight = 2000, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with reduced quality
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Get image metadata (dimensions, file size, MIME type)
 * @param {File} file - Image file
 * @returns {Promise<Object>} - Image metadata
 */
export const getImageMetadata = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          fileSize: file.size,
          fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
          mimeType: file.type,
          name: file.name,
        });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Check if image needs optimization based on file size
 * @param {number} fileSize - File size in bytes
 * @param {number} threshold - Size threshold in bytes (default 5MB)
 * @returns {boolean}
 */
export const needsOptimization = (fileSize, threshold = 5 * 1024 * 1024) => {
  return fileSize > threshold;
};

/**
 * Estimate upload time based on file size and network speed
 * @param {number} fileSize - File size in bytes
 * @param {number} mbps - Network speed in Mbps (default 5 for 4G-LTE)
 * @returns {number} - Estimated time in seconds
 */
export const estimateUploadTime = (fileSize, mbps = 5) => {
  const bits = fileSize * 8;
  const bps = mbps * 1024 * 1024;
  return Math.ceil(bits / bps);
};
