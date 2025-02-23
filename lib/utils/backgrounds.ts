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
  device?: {
    type: 'mobile' | 'tablet' | 'desktop';
    pixelRatio: number;
  };
  optimization?: {
    quality: 'low' | 'medium' | 'high' | 'auto';
    priority: 'speed' | 'quality';
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
  format: string;
  quality: number;
  device?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

interface DeviceConfig {
  maxWidth: number;
  maxHeight: number;
  pixelRatio: number;
  defaultFormat: 'webp' | 'jpg' | 'png';
  defaultQuality: number;
  optimizationPreset: {
    quality: 'low' | 'medium' | 'high' | 'auto';
    priority: 'speed' | 'quality';
  };
}

class BackgroundHandler {
  private cache: Map<string, CachedBackground>;
  private readonly cacheTimeout = 1000 * 60 * 60; // 1 hour
  private readonly cloudName: string;
  private readonly defaultDimensions = {
    width: 1080,
    height: 1080
  };

  private readonly deviceConfigs: Record<'mobile' | 'tablet' | 'desktop', DeviceConfig> = {
    mobile: {
      maxWidth: 640,
      maxHeight: 1136,
      pixelRatio: 2,
      defaultFormat: 'webp',
      defaultQuality: 80,
      optimizationPreset: {
        quality: 'medium',
        priority: 'speed'
      }
    },
    tablet: {
      maxWidth: 1024,
      maxHeight: 1366,
      pixelRatio: 2,
      defaultFormat: 'webp',
      defaultQuality: 85,
      optimizationPreset: {
        quality: 'high',
        priority: 'quality'
      }
    },
    desktop: {
      maxWidth: 1920,
      maxHeight: 1080,
      pixelRatio: 1,
      defaultFormat: 'webp',
      defaultQuality: 90,
      optimizationPreset: {
        quality: 'high',
        priority: 'quality'
      }
    }
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
   * Preprocess image for optimal display
   */
  private preprocessImage(url: string, options: BackgroundOptions = {}): string {
    // Detect device type and get configuration
    const deviceConfig = this.getDeviceConfig(options.device?.type || 'desktop');
    
    // Apply device-specific optimizations
    const optimizedOptions = this.getOptimizedSettings(deviceConfig, options);
    
    // Calculate dimensions based on device
    const dimensions = this.calculateDeviceDimensions(deviceConfig, options);
    
    return this.optimizeImageUrl(url, {
      ...optimizedOptions,
      width: dimensions.width,
      height: dimensions.height
    });
  }

  /**
   * Get device-specific configuration
   */
  private getDeviceConfig(deviceType: 'mobile' | 'tablet' | 'desktop'): DeviceConfig {
    return this.deviceConfigs[deviceType];
  }

  /**
   * Calculate optimal dimensions for device
   */
  private calculateDeviceDimensions(
    deviceConfig: DeviceConfig,
    options: BackgroundOptions
  ): { width: number; height: number } {
    const targetWidth = Math.min(
      options.width || this.defaultDimensions.width,
      deviceConfig.maxWidth * deviceConfig.pixelRatio
    );
    
    const targetHeight = Math.min(
      options.height || this.defaultDimensions.height,
      deviceConfig.maxHeight * deviceConfig.pixelRatio
    );

    return this.calculateFillDimensions({
      width: targetWidth,
      height: targetHeight,
      aspectRatio: targetWidth / targetHeight
    });
  }

  /**
   * Get optimized settings based on device and options
   */
  private getOptimizedSettings(
    deviceConfig: DeviceConfig,
    options: BackgroundOptions
  ): BackgroundOptions {
    const quality = this.resolveQuality(
      options.optimization?.quality || deviceConfig.optimizationPreset.quality,
      deviceConfig.defaultQuality
    );

    return {
      ...options,
      format: options.format || deviceConfig.defaultFormat,
      quality,
      overlay: options.overlay || {
        color: 'black',
        opacity: 50
      }
    };
  }

  /**
   * Resolve quality setting based on preset and device defaults
   */
  private resolveQuality(
    quality: 'low' | 'medium' | 'high' | 'auto',
    defaultQuality: number
  ): number {
    switch (quality) {
      case 'low': return Math.min(defaultQuality, 70);
      case 'medium': return Math.min(defaultQuality, 80);
      case 'high': return Math.min(defaultQuality, 90);
      case 'auto': return defaultQuality;
    }
  }

  /**
   * Get optimized background URL with enhanced caching
   */
  getOptimizedUrl(url: string, options?: BackgroundOptions): string {
    const cacheKey = this.generateCacheKey(url, options);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.optimizedUrl;
    }

    // Preprocess and optimize image
    const optimizedUrl = this.preprocessImage(url, options);

    // Update cache with detailed metadata
    this.cache.set(cacheKey, {
      url,
      optimizedUrl,
      timestamp: Date.now(),
      dimensions: this.defaultDimensions,
      format: options?.format || 'webp',
      quality: options?.quality || 90,
      device: options?.device?.type
    });

    return optimizedUrl;
  }

  /**
   * Generate cache key including device and optimization settings
   */
  private generateCacheKey(url: string, options?: BackgroundOptions): string {
    const device = options?.device?.type || 'desktop';
    const quality = options?.optimization?.quality || 'auto';
    const format = options?.format || 'webp';
    return `${url}-${device}-${quality}-${format}`;
  }

  /**
   * Clear expired cache entries with logging
   */
  private cleanCache(): void {
    const now = Date.now();
    let cleared = 0;
    
    for (const [url, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.cache.delete(url);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`Cleared ${cleared} expired background cache entries`);
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