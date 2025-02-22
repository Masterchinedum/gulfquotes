interface ImageDimensions {
  width: number;
  height: number;
}

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  aspectRatio?: string;
}

export const quoteImageUtils = {
  /**
   * Calculate optimal image dimensions maintaining aspect ratio
   */
  calculateDimensions(original: ImageDimensions, maxWidth: number, maxHeight: number): ImageDimensions {
    const ratio = Math.min(maxWidth / original.width, maxHeight / original.height);
    
    return {
      width: Math.round(original.width * ratio),
      height: Math.round(original.height * ratio)
    };
  },

  /**
   * Generate optimized image URL
   */
  getOptimizedUrl(url: string, options: ImageOptimizationOptions = {}): string {
    const {
      quality = 90,
      format = 'auto',
      aspectRatio = '16:10'
    } = options;

    // If URL is from Cloudinary, optimize using their parameters
    if (url.includes('cloudinary.com')) {
      return url
        .replace('/upload/', `/upload/q_${quality},f_${format},ar_${aspectRatio},c_fill/`);
    }

    return url;
  },

  /**
   * Check if image dimensions are suitable for quote background
   */
  isValidDimensions(width: number, height: number): boolean {
    const minWidth = 800;
    const minHeight = 500;
    const aspectRatio = width / height;
    
    return width >= minWidth && 
           height >= minHeight && 
           aspectRatio >= 1.4 && 
           aspectRatio <= 2.1;
  }
};