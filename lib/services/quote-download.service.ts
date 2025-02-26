// lib/services/quote-download.service.ts
import { AppError } from "@/lib/api-error";
import html2canvas from "html2canvas";
// import type { QuoteDisplayData } from "./public-quote/quote-display.service";

// Simplify interfaces
export interface DownloadSettings {
  width: number;
  height: number;
  quality: number;
  scale: number;
  format: 'png' | 'jpg' | 'webp';
}

export interface GenerateImageOptions {
  format?: 'png' | 'jpg' | 'webp';
}

// Single fixed configuration
const DOWNLOAD_CONFIG = {
  width: 1080,
  height: 1080,
  quality: 0.9, // High quality
  scale: 2,     // Retina display support
  format: 'png' as const
} as const;

class QuoteDownloadService {
  async generateImage(
    element: HTMLElement,
    options: GenerateImageOptions = {}
  ): Promise<string> {
    try {
      // Store original styles
      const originalStyles = {
        width: element.style.width,
        height: element.style.height,
        position: element.style.position,
        transform: element.style.transform
      };

      // Set fixed dimensions
      element.style.width = `${DOWNLOAD_CONFIG.width}px`;
      element.style.height = `${DOWNLOAD_CONFIG.height}px`;
      element.style.position = 'relative';
      element.style.transform = 'none';

      await Promise.all([
        document.fonts.ready,
        this.waitForImages(element)
      ]);

      const canvas = await html2canvas(element, {
        width: DOWNLOAD_CONFIG.width,
        height: DOWNLOAD_CONFIG.height,
        scale: DOWNLOAD_CONFIG.scale,
        useCORS: true,
        logging: false,
        backgroundColor: null,
        allowTaint: true,
        onclone: (clonedDoc, clonedElement) => {
          const backgroundElements = [
            ...Array.from(clonedElement.getElementsByClassName('bg-image')),
            ...Array.from(clonedElement.getElementsByTagName('img'))
          ];
          
          backgroundElements.forEach((bgElement) => {
            if (bgElement instanceof HTMLElement) {
              bgElement.style.objectFit = 'cover';
              bgElement.style.objectPosition = 'center';
              bgElement.style.width = '100%';
              bgElement.style.height = '100%';
            }
          });
        }
      });

      // Restore original styles
      element.style.width = originalStyles.width;
      element.style.height = originalStyles.height;
      element.style.position = originalStyles.position;
      element.style.transform = originalStyles.transform;

      // Process canvas with fixed settings
      return this.processCanvas(canvas, {
        ...DOWNLOAD_CONFIG,
        format: options.format || DOWNLOAD_CONFIG.format
      });
    } catch (error) {
      console.error("[QUOTE_DOWNLOAD_SERVICE]", error);
      throw new AppError("Failed to generate image", "IMAGE_UPLOAD_FAILED", 500);
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

  // Remove unused methods
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
}

export const quoteDownloadService = new QuoteDownloadService();