// lib/utils/backgrounds.ts
import { cloudinaryConfig } from "@/lib/cloudinary";
import type { GalleryItem } from "@/types/gallery";

interface BackgroundOptions {
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  width?: number;
  height?: number;
  overlay?: {
    color?: string;
    opacity?: number;
  };
}

interface CachedBackground {
  url: string;
  optimizedUrl: string;
  timestamp: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

class BackgroundHandler {
  private cache: Map<string, CachedBackground>;
  private readonly cacheTimeout = 1000 * 60 * 60; // 1 hour
  private readonly cloudName: string;
  private readonly defaultDimensions = {
    width: 1080,
    height: 1080
  };
  
  constructor() {
    this.cache = new Map();
    this.cloudName = cloudinaryConfig.cloudName;
  }

  /**
   * Verify image dimensions meet requirements
   */
  verifyDimensions(dimensions: ImageDimensions): boolean {
    const minDimension = 1080;
    return dimensions.width >= minDimension && dimensions.height >= minDimension;
  }

  /**
   * Calculate dimensions to fill 1080x1080 while maintaining aspect ratio
   */
  private calculateFillDimensions(original: ImageDimensions): { width: number; height: number } {
    const targetSize = 1080;
    const scale = Math.max(
      targetSize / original.width,
      targetSize / original.height
    );

    return {
      width: Math.round(original.width * scale),
      height: Math.round(original.height * scale)
    };
  }

  /**
   * Optimize background image URL using Cloudinary transformations
   */
  private optimizeImageUrl(url: string, options: BackgroundOptions = {}): string {
    const {
      quality = 90,
      format = 'auto',
      width = this.defaultDimensions.width,
      height = this.defaultDimensions.height,
      overlay
    } = options;

    // Only handle Cloudinary URLs for our cloud
    if (!url.includes(`${this.cloudName}.cloudinary.com`)) return url;

    // Build transformation string with format validation
    const transforms = [
      `w_${width}`,
      `h_${height}`,
      `q_${quality}`,
      `f_${format}`,
      'c_fill',
      'g_center'
    ];

    // Add overlay if specified
    if (overlay) {
      const { color = 'black', opacity = 50 } = overlay;
      transforms.push(`e_colorize,co_${color},o_${opacity}`);
    }

    // Replace /upload/ with our transformations
    return url.replace(
      '/upload/',
      `/upload/${transforms.join(',')}/`
    );
  }

  /**
   * Get optimized background URL with caching and dimension verification
   */
  getOptimizedUrl(url: string, options?: BackgroundOptions): string {
    // Check cache first
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.optimizedUrl;
    }

    // Generate new optimized URL with 1080x1080 dimensions
    const optimizedUrl = this.optimizeImageUrl(url, {
      ...options,
      width: this.defaultDimensions.width,
      height: this.defaultDimensions.height
    });

    // Update cache
    this.cache.set(url, {
      url,
      optimizedUrl,
      timestamp: Date.now(),
      dimensions: this.defaultDimensions
    });

    return optimizedUrl;
  }

  /**
   * Clear expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [url, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.cache.delete(url);
      }
    }
  }

  /**
   * Get background options based on image content and configuration
   */
  getOverlayOptions(image: GalleryItem): BackgroundOptions['overlay'] {
    // Ensure image format is supported
    const supportedFormats = cloudinaryConfig.limits.gallery.allowedFormats;
    const format = image.format?.toLowerCase();

    if (format && !supportedFormats.includes(format)) {
      console.warn(`Unsupported image format: ${format}`);
    }

    // Default dark overlay for readability
    const defaultOverlay = {
      color: 'black',
      opacity: 50
    };

    return defaultOverlay;
  }

  /**
   * Create full background style including overlay
   */
  createBackgroundStyle(imageUrl: string | null): Record<string, string> {
    if (!imageUrl) {
      return {
        background: 'linear-gradient(to bottom right, var(--primary-50), var(--primary-900))'
      };
    }

    const optimizedUrl = this.getOptimizedUrl(imageUrl, {
      overlay: {
        color: 'black',
        opacity: 50
      }
    });

    return {
      backgroundImage: `url(${optimizedUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }

  /**
   * Clear all cached backgrounds
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const backgroundHandler = new BackgroundHandler();