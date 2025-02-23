// lib/utils/backgrounds.ts
import { cloudinaryConfig } from "@/lib/cloudinary";
import type { GalleryItem } from "@/types/gallery";

interface BackgroundOptions {
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  overlay?: {
    color?: string;
    opacity?: number;
  };
}

interface CachedBackground {
  url: string;
  optimizedUrl: string;
  timestamp: number;
}

class BackgroundHandler {
  private cache: Map<string, CachedBackground>;
  private readonly cacheTimeout = 1000 * 60 * 60; // 1 hour
  private readonly cloudName: string;
  
  constructor() {
    this.cache = new Map();
    this.cloudName = cloudinaryConfig.cloudName;
  }

  /**
   * Optimize background image URL using Cloudinary transformations
   */
  private optimizeImageUrl(url: string, options: BackgroundOptions = {}): string {
    const {
      quality = 90,
      format = 'auto',
      overlay
    } = options;

    // Only handle Cloudinary URLs for our cloud
    if (!url.includes(`${this.cloudName}.cloudinary.com`)) return url;

    // Build transformation string with format validation
    const transforms = [
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
   * Get optimized background URL with caching
   */
  getOptimizedUrl(url: string, options?: BackgroundOptions): string {
    // Check cache first
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.optimizedUrl;
    }

    // Generate new optimized URL
    const optimizedUrl = this.optimizeImageUrl(url, options);

    // Update cache
    this.cache.set(url, {
      url,
      optimizedUrl,
      timestamp: Date.now()
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
    if (!supportedFormats.includes(image.format.toLowerCase())) {
      console.warn(`Unsupported image format: ${image.format}`);
    }

    // Default dark overlay for readability
    const defaultOverlay = {
      color: 'black',
      opacity: 50
    };

    // TODO: Implement intelligent overlay based on image brightness/contrast
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