// lib/utils/imageScaler.ts
import { createCanvas, loadImage } from 'canvas';
import { cloudinaryConfig } from '@/lib/cloudinary';

interface ScalingOptions {
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  maxWidth?: number;
  maxHeight?: number;
  devicePixelRatio?: number;
  preserveText?: boolean; // New option for text quality
}

interface CachedImage {
  buffer: Buffer;
  width: number;
  height: number;
  timestamp: number;
  format: string;
  quality: number;
}

interface DeviceBreakpoint {
  width: number;
  height: number;
  pixelRatio: number;
  defaultFormat: 'webp' | 'jpeg' | 'png';
  defaultQuality: number;
}

interface CompressionOptions {
  quality: number;
  lossless?: boolean;
  nearLossless?: boolean;
  smartSubsample?: boolean;
  reductionEffort?: number;
  compressionLevel?: number;
  filters?: number;
  progressive?: boolean;
  chromaSubsampling?: boolean;
}

export class ImageScaler {
  private cache: Map<string, CachedImage>;
  private readonly cacheTimeout = 1000 * 60 * 60; // 1 hour
  
  // Enhanced device breakpoints with format and quality preferences
  private readonly deviceBreakpoints: DeviceBreakpoint[] = [
    { 
      width: 320, 
      height: 568, 
      pixelRatio: 1,
      defaultFormat: 'webp',
      defaultQuality: 75
    },    // iPhone SE - Lower quality for smaller screens
    { 
      width: 375, 
      height: 667, 
      pixelRatio: 2,
      defaultFormat: 'webp',
      defaultQuality: 80
    },    // iPhone 8
    { 
      width: 390, 
      height: 844, 
      pixelRatio: 3,
      defaultFormat: 'webp',
      defaultQuality: 85
    },    // iPhone 12
    { 
      width: 414, 
      height: 896, 
      pixelRatio: 3,
      defaultFormat: 'webp',
      defaultQuality: 85
    },    // iPhone 11 Pro Max
    { 
      width: 768, 
      height: 1024, 
      pixelRatio: 2,
      defaultFormat: 'webp',
      defaultQuality: 85
    },   // iPad
    { 
      width: 1024, 
      height: 1366, 
      pixelRatio: 2,
      defaultFormat: 'webp',
      defaultQuality: 90
    },  // iPad Pro
    { 
      width: 1280, 
      height: 800, 
      pixelRatio: 1,
      defaultFormat: 'webp',
      defaultQuality: 90
    },   // Desktop
    { 
      width: 1920, 
      height: 1080, 
      pixelRatio: 1,
      defaultFormat: 'webp',
      defaultQuality: 95
    },  // Full HD
    { 
      width: 2560, 
      height: 1440, 
      pixelRatio: 1,
      defaultFormat: 'webp',
      defaultQuality: 100
    },  // 2K - Highest quality
  ];

  constructor() {
    this.cache = new Map();
  }

  /**
   * Scale image buffer to target dimensions with enhanced quality preservation
   */
  private async scaleBuffer(
    sourceBuffer: Buffer,
    targetWidth: number,
    targetHeight: number,
    options: ScalingOptions = {}
  ): Promise<Buffer> {
    const {
      quality = 90,
      format = 'webp',
      devicePixelRatio = 1,
      preserveText = true
    } = options;

    // Validate format before processing
    if (!this.validateFormat(format)) {
      throw new Error(
        `Unsupported format: ${format}. Allowed formats: ${cloudinaryConfig.limits.gallery.allowedFormats.join(', ')}`
      );
    }

    // Scale dimensions by device pixel ratio
    const scaledWidth = Math.round(targetWidth * devicePixelRatio);
    const scaledHeight = Math.round(targetHeight * devicePixelRatio);

    // Create canvas with target dimensions
    const canvas = createCanvas(scaledWidth, scaledHeight);
    const ctx = canvas.getContext('2d');

    // Enable text quality preservation
    if (preserveText) {
      ctx.textRendering = 'geometricPrecision';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    // Load and draw source image
    const image = await loadImage(sourceBuffer);
    this.drawOptimizedImage(ctx, image, scaledWidth, scaledHeight);

    // Determine optimal compression settings
    const compressionOptions = this.getCompressionOptions(format, quality, preserveText);

    // Return optimized buffer
    return canvas.toBuffer(`image/${format}`, compressionOptions);
  }

  /**
   * Draw image with optimal quality settings
   */
  private drawOptimizedImage(
    ctx: CanvasRenderingContext2D,
    image: import('canvas').Image,
    targetWidth: number,
    targetHeight: number
  ): void {
    // Calculate scaling while maintaining aspect ratio
    const scale = Math.min(
      targetWidth / image.width,
      targetHeight / image.height
    );

    // Center the image
    const x = (targetWidth - image.width * scale) / 2;
    const y = (targetHeight - image.height * scale) / 2;

    // Draw with high quality
    ctx.drawImage(
      image,
      x, y,
      image.width * scale,
      image.height * scale
    );
  }

  /**
   * Get optimal compression options based on format and content
   */
  private getCompressionOptions(
    format: string,
    quality: number,
    preserveText: boolean
  ): CompressionOptions {
    const baseOptions = {
      quality: quality / 100,
    };

    // Use Cloudinary's recommended quality settings as a baseline
    const cloudinaryQuality = Math.min(
      quality,
      cloudinaryConfig.limits.maxFileSize > 5 * 1024 * 1024 ? 90 : 85
    );

    switch (format) {
      case 'webp':
        return {
          ...baseOptions,
          quality: cloudinaryQuality / 100,
          lossless: preserveText,
          nearLossless: preserveText,
          smartSubsample: true,
          reductionEffort: 6
        };
      case 'png':
        return {
          ...baseOptions,
          quality: cloudinaryQuality / 100,
          compressionLevel: 9,
          filters: preserveText ? 4 : 0
        };
      case 'jpeg':
        return {
          ...baseOptions,
          quality: cloudinaryQuality / 100,
          progressive: true,
          chromaSubsampling: !preserveText
        };
      default:
        return {
          quality: cloudinaryQuality / 100
        };
    }
  }

  /**
   * Scale image for specific device with optimized settings
   */
  async scaleForDevice(
    sourceBuffer: Buffer,
    deviceWidth: number,
    deviceHeight: number,
    options: ScalingOptions = {}
  ): Promise<Buffer> {
    // Find device-specific settings
    const breakpoint = this.findDeviceBreakpoint(deviceWidth, deviceHeight);
    
    // Merge device-specific settings with provided options
    const finalOptions = this.mergeWithDeviceDefaults(options, breakpoint);

    // Generate cache key
    const cacheKey = this.getCacheKey(sourceBuffer, breakpoint, finalOptions);

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached.buffer;

    // Scale image with optimized settings
    const scaledBuffer = await this.scaleBuffer(
      sourceBuffer,
      breakpoint.width,
      breakpoint.height,
      finalOptions
    );

    // Update cache
    this.updateCache(cacheKey, scaledBuffer, breakpoint, finalOptions);

    return scaledBuffer;
  }

  // Helper methods...
  private findDeviceBreakpoint(width: number, height: number): DeviceBreakpoint {
    return this.deviceBreakpoints.find(bp => bp.width === width && bp.height === height) 
      ?? this.getDefaultBreakpoint(width, height);
  }

  private getDefaultBreakpoint(width: number, height: number): DeviceBreakpoint {
    return {
      width,
      height,
      pixelRatio: 1,
      defaultFormat: 'webp',
      defaultQuality: 85
    };
  }

  private mergeWithDeviceDefaults(
    options: ScalingOptions,
    breakpoint: DeviceBreakpoint
  ): ScalingOptions {
    return {
      format: options.format ?? breakpoint.defaultFormat,
      quality: options.quality ?? breakpoint.defaultQuality,
      devicePixelRatio: options.devicePixelRatio ?? breakpoint.pixelRatio,
      preserveText: options.preserveText ?? true,
      ...options
    };
  }

  private getCacheKey(
    sourceBuffer: Buffer,
    breakpoint: DeviceBreakpoint,
    options: ScalingOptions
  ): string {
    // Create hash from buffer
    const hash = Buffer.from(sourceBuffer).toString('base64').slice(0, 8);
    
    // Include Cloudinary cloud name for uniqueness
    const cloudName = cloudinaryConfig.cloudName;
    
    // Combine all relevant parameters
    return `${cloudName}-${hash}-${breakpoint.width}x${breakpoint.height}-${options.quality}-${options.format}-${options.devicePixelRatio}`;
  }

  // Add corresponding cache methods
  private getFromCache(key: string): CachedImage | undefined {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached;
    }
    return undefined;
  }

  private updateCache(
    key: string,
    buffer: Buffer,
    breakpoint: DeviceBreakpoint,
    options: ScalingOptions
  ): void {
    this.cache.set(key, {
      buffer,
      width: breakpoint.width,
      height: breakpoint.height,
      timestamp: Date.now(),
      format: options.format || 'webp',
      quality: options.quality || 90
    });
  }

  /**
   * Validate image format against Cloudinary allowed formats
   */
  private validateFormat(format: string): boolean {
    // Get all unique allowed formats from Cloudinary config
    const allowedFormats = new Set([
      ...cloudinaryConfig.limits.profiles.allowedFormats,
      ...cloudinaryConfig.limits.authors.allowedFormats,
      ...cloudinaryConfig.limits.quotes.allowedFormats,
      ...cloudinaryConfig.limits.gallery.allowedFormats
    ]);

    return allowedFormats.has(format.toLowerCase());
  }

  // Cache management methods remain the same...
}

// Export singleton instance
export const imageScaler = new ImageScaler();