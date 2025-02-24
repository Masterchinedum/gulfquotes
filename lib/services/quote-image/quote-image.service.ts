import { fabric } from 'fabric';
import type { Quote } from "@prisma/client";

interface QuoteImageOptions {
  width?: number;
  height?: number;
  padding?: number;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  branding?: {
    text: string;
    color?: string;
    fontSize?: number;
  };
}

export class QuoteImageService {
  private readonly defaultOptions: Required<QuoteImageOptions> = {
    width: 1080,
    height: 1080,
    padding: 40,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Inter',
    branding: {
      text: 'Quoticon',
      color: '#666666',
      fontSize: 24
    }
  };

  /**
   * Calculate font size based on quote length
   */
  private calculateFontSize(textLength: number): number {
    if (textLength > 700) return 20;
    if (textLength <= 700) return 30;
    if (textLength <= 600) return 31;
    if (textLength <= 550) return 33;
    if (textLength <= 500) return 35;
    if (textLength <= 450) return 36;
    if (textLength <= 400) return 38;
    if (textLength <= 350) return 39;
    if (textLength <= 300) return 40;
    if (textLength <= 240) return 41;
    if (textLength <= 100) return 45;
    return 30; // default size
  }

  /**
   * Create quote image
   */
  async createImage(quote: Quote, options?: QuoteImageOptions): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const canvas = new fabric.Canvas(null, {
      width: opts.width,
      height: opts.height
    });

    // Add background if provided
    if (quote.backgroundImage) {
      const bgImage = await this.loadImage(quote.backgroundImage);
      const scaled = this.scaleImageToFill(bgImage, opts.width, opts.height);
      canvas.setBackgroundImage(scaled, canvas.renderAll.bind(canvas));
      
      // Add dark overlay for better text visibility
      const overlay = new fabric.Rect({
        width: opts.width,
        height: opts.height,
        fill: 'rgba(0,0,0,0.5)'
      });
      canvas.add(overlay);
    }

    // Add quote text
    const fontSize = this.calculateFontSize(quote.content.length);
    const quoteText = new fabric.Textbox(`"${quote.content}"`, {
      width: opts.width - (opts.padding * 2),
      fontSize,
      fontFamily: opts.fontFamily,
      fill: quote.backgroundImage ? '#ffffff' : opts.textColor,
      textAlign: 'center',
      top: opts.padding,
      left: opts.padding
    });

    // Add author name
    const authorText = new fabric.Text(`- ${quote.authorProfile.name}`, {
      fontSize: fontSize * 0.5,
      fontFamily: opts.fontFamily,
      fill: quote.backgroundImage ? '#ffffff' : opts.textColor,
      left: opts.padding,
      top: opts.height - (opts.padding * 2)
    });

    // Add branding
    const brandingText = new fabric.Text(opts.branding.text, {
      fontSize: opts.branding.fontSize,
      fontFamily: opts.fontFamily,
      fill: quote.backgroundImage ? '#ffffff' : opts.branding.color,
      left: opts.width - opts.padding - 100,
      top: opts.height - (opts.padding * 2)
    });

    // Add elements to canvas
    canvas.add(quoteText, authorText, brandingText);

    // Center quote text vertically
    const bounds = quoteText.getBoundingRect();
    const centerY = (opts.height - bounds.height) / 2;
    quoteText.set('top', centerY);

    // Generate image
    canvas.renderAll();
    return canvas.toDataURL('image/png');
  }

  /**
   * Load image from URL
   */
  private loadImage(url: string): Promise<fabric.Image> {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(url, (img) => {
        if (img) {
          resolve(img);
        } else {
          reject(new Error('Failed to load image'));
        }
      });
    });
  }

  /**
   * Scale image to fill dimensions while maintaining aspect ratio
   */
  private scaleImageToFill(image: fabric.Image, targetWidth: number, targetHeight: number): fabric.Image {
    const scale = Math.max(
      targetWidth / image.width!,
      targetHeight / image.height!
    );

    image.scale(scale);

    // Center the image
    image.set({
      left: (targetWidth - image.width! * scale) / 2,
      top: (targetHeight - image.height! * scale) / 2
    });

    return image;
  }
}

export const quoteImageService = new QuoteImageService();