// lib/services/quote-download.service.ts
import { AppError } from "@/lib/api-error";
import html2canvas from "html2canvas";
// import type { QuoteDisplayData } from "./public-quote/quote-display.service";

export interface DownloadSettings {
  width: number;
  height: number;
  quality: number;
  scale: number;
  format: 'png' | 'jpg' | 'webp';
}

export interface GenerateImageOptions {
  quality?: number;
  format?: 'png' | 'jpg' | 'webp';
  scale?: number;
  width?: number;
  height?: number;
}

// Quality presets for different use cases
export const QUALITY_PRESETS = {
  high: {
    width: 1080 * 3,
    height: 1080 * 3,
    quality: 1.0,
    scale: 3,
    format: 'png' as const
  },
  standard: {
    width: 1080 * 2,
    height: 1080 * 2,
    quality: 0.9,
    scale: 2,
    format: 'png' as const
  },
  web: {
    width: 1080 * 1.5,
    height: 1080 * 1.5,
    quality: 0.8,
    scale: 1.5,
    format: 'webp' as const
  }
} as const;

const CANVAS_SIZE = 1080;

class QuoteDownloadService {
  private readonly DEFAULT_SCALE = 2;

  /**
   * Generate high-quality image from DOM element
   */
  async generateImage(
    element: HTMLElement,
    options: GenerateImageOptions = {}
  ): Promise<string> {
    try {
      // Store original styles as an object
      const originalStyles = {
        width: element.style.width,
        height: element.style.height,
        position: element.style.position,
        transform: element.style.transform
      };

      // Set styles individually instead of using Object.assign
      element.style.width = `${CANVAS_SIZE}px`;
      element.style.height = `${CANVAS_SIZE}px`;
      element.style.position = 'relative';
      element.style.transform = 'none';

      await Promise.all([
        document.fonts.ready,
        this.waitForImages(element)
      ]);

      const canvas = await html2canvas(element, {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        scale: options.scale || QUALITY_PRESETS.standard.scale,
        useCORS: true,
        logging: false,
        backgroundColor: null,
        allowTaint: true,
        onclone: (clonedDoc, clonedElement) => {
          // Fix background image scaling in cloned element
          const backgroundElements = clonedElement.getElementsByClassName('bg-image');
          Array.from(backgroundElements).forEach((bgElement: HTMLElement) => {
            bgElement.style.backgroundSize = 'cover';
            bgElement.style.backgroundPosition = 'center';
            bgElement.style.width = '100%';
            bgElement.style.height = '100%';
          });
        }
      });

      // Restore styles individually
      element.style.width = originalStyles.width;
      element.style.height = originalStyles.height;
      element.style.position = originalStyles.position;
      element.style.transform = originalStyles.transform;

      // Process and optimize the output
      return this.processCanvas(canvas, {
        ...QUALITY_PRESETS[this.getQualityPreset(options)],
        ...options
      });
    } catch (error) {
      console.error("[QUOTE_DOWNLOAD_SERVICE]", error);
      throw new AppError(
        "Failed to generate image",
        "IMAGE_UPLOAD_FAILED",
        500
      );
    }
  }

  private async waitForImages(element: HTMLElement): Promise<void> {
    const images = element.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue even if image fails
      });
    });
    await Promise.all(imagePromises);
  }

  /**
   * Process canvas with optimization settings
   */
  private async processCanvas(
    canvas: HTMLCanvasElement,
    settings: DownloadSettings
  ): Promise<string> {
    try {
      // Create temporary canvas for resizing if needed
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = settings.width;
      outputCanvas.height = settings.height;

      const ctx = outputCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Enable image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw and scale image
      ctx.drawImage(
        canvas,
        0, 0, canvas.width, canvas.height,
        0, 0, settings.width, settings.height
      );

      // Convert to proper format with quality settings
      const mimeType = this.getMimeType(settings.format);
      return outputCanvas.toDataURL(mimeType, settings.quality);
    } catch (error) {
      console.error("[QUOTE_DOWNLOAD_SERVICE]", error);
      throw new AppError(
        "Failed to process image",
        "IMAGE_UPLOAD_FAILED", // Using valid error code from AppErrorCode
        500
      );
    }
  }

  /**
   * Normalize settings with defaults
   */
  private normalizeSettings(options: GenerateImageOptions): DownloadSettings {
    const preset = QUALITY_PRESETS[
      this.getQualityPreset(options)
    ];

    return {
      width: options.width || preset.width,
      height: options.height || preset.height,
      quality: options.quality || preset.quality,
      scale: options.scale || preset.scale,
      format: options.format || preset.format
    };
  }

  /**
   * Get appropriate quality preset based on options
   */
  private getQualityPreset(options: GenerateImageOptions): keyof typeof QUALITY_PRESETS {
    if (options.scale && options.scale >= 3) return 'high';
    if (options.format === 'webp') return 'web';
    return 'standard';
  }

  /**
   * Get proper mime type for format
   */
  private getMimeType(format: DownloadSettings['format']): string {
    switch (format) {
      case 'jpg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/png';
    }
  }

  /**
   * Calculate optimal dimensions
   */
  getOptimalDimensions(targetWidth: number, targetHeight: number): {
    width: number;
    height: number;
    scale: number;
  } {
    const maxSize = 5000; // Maximum size limit
    const scale = Math.min(
      maxSize / targetWidth,
      maxSize / targetHeight,
      3 // Maximum scale factor
    );

    return {
      width: Math.round(targetWidth * scale),
      height: Math.round(targetHeight * scale),
      scale
    };
  }
}

// Export service instance
export const quoteDownloadService = new QuoteDownloadService();