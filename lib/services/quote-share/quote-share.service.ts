// lib/services/quote-share/quote-share.service.ts

import type { Quote } from "@prisma/client";
import { slugify } from "@/lib/utils";

interface ExportOptions {
  format?: 'png' | 'jpeg';
  quality?: number;
  fileName?: string;
}

interface ShareOptions extends ExportOptions {
  title?: string;
  text?: string;
}

export class QuoteShareService {
  private readonly defaultOptions: Required<ExportOptions> = {
    format: 'png',
    quality: 1,
    fileName: 'quote'
  };

  /**
   * Generate file name for quote
   */
  private generateFileName(quote: Quote, format: string): string {
    const timestamp = new Date().getTime();
    const baseSlug = quote.slug || slugify(quote.content.substring(0, 50));
    return `quote-${baseSlug}-${timestamp}.${format}`;
  }

  /**
   * Optimize image quality based on size
   */
  private optimizeQuality(dataUrl: string, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL(`image/${this.defaultOptions.format}`, quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  }

  /**
   * Export quote as image
   */
  async exportImage(
    quote: Quote, 
    imageData: string,
    options?: ExportOptions
  ): Promise<{ dataUrl: string; fileName: string }> {
    const opts = { ...this.defaultOptions, ...options };
    const optimizedData = await this.optimizeQuality(imageData, opts.quality);
    const fileName = opts.fileName || this.generateFileName(quote, opts.format);

    return {
      dataUrl: optimizedData,
      fileName
    };
  }

  /**
   * Download quote image
   */
  async download(
    quote: Quote,
    imageData: string,
    options?: ExportOptions
  ): Promise<void> {
    const { dataUrl, fileName } = await this.exportImage(quote, imageData, options);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Share quote image
   */
  async share(
    quote: Quote,
    imageData: string,
    options?: ShareOptions
  ): Promise<void> {
    try {
      const { dataUrl, fileName } = await this.exportImage(quote, imageData, options);

      // Convert base64 to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: `image/${options?.format || this.defaultOptions.format}` });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: options?.title || `Quote by ${quote.authorProfile.name}`,
          text: options?.text || quote.content
        });
      } else {
        // Fallback to download if Web Share API is not available
        await this.download(quote, imageData, options);
      }
    } catch (error) {
      console.error('Failed to share quote:', error);
      throw new Error('Failed to share quote');
    }
  }
}

export const quoteShareService = new QuoteShareService();