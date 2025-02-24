import { Canvas, Image, Textbox, Text, Rect } from "fabric";
import type { Quote, AuthorProfile } from "@prisma/client"; // Add AuthorProfile import

interface QuoteImageOptions {
  width?: number;
  height?: number;
  padding?: number;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  overlay?: {
    color?: string;
    opacity?: number;
  };
  branding?: {
    text: string;
    color?: string;
    fontSize?: number;
  };
}

// Add interface for Quote with relations
interface QuoteWithAuthor extends Quote {
  authorProfile: AuthorProfile;
}

export class QuoteImageService {
  private readonly defaultOptions: Required<QuoteImageOptions> = {
    width: 1080,
    height: 1080,
    padding: 40,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Inter',
    fontSize: 30, // Add default fontSize
    overlay: {
      color: '#000000',
      opacity: 0.5
    },
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
    return 30;
  }

  /**
   * Create quote image
   */
  async createImage(quote: QuoteWithAuthor, options?: QuoteImageOptions): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      throw new Error('Quote image generation is only available in the browser');
    }

    // Create a canvas element
    const canvasEl = document.createElement('canvas');
    const canvas = new Canvas(canvasEl, {
      width: opts.width,
      height: opts.height
    });

    // Handle background
    if (quote.backgroundImage) {
      await this.setupBackground(canvas, quote.backgroundImage, opts);
    } else {
      canvas.backgroundColor = opts.backgroundColor;
    }

    // Add content
    await this.addContent(canvas, quote, opts);

    // Generate image
    canvas.renderAll();
    return canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1, // Add required multiplier property
      enableRetinaScaling: false
    });
  }

  /**
   * Setup background with image
   */
  private async setupBackground(
    canvas: Canvas, 
    imageUrl: string, 
    options: Required<QuoteImageOptions>
  ): Promise<void> {
    try {
      const bgImage = await this.loadImage(imageUrl);
      const scaled = this.scaleImageToFill(bgImage, options.width, options.height);
      
      // Set background image
      canvas.backgroundImage = scaled;
      canvas.renderAll();
      
      // Add overlay for better text visibility
      const overlay = new Rect({
        width: options.width,
        height: options.height,
        fill: options.overlay.color,
        opacity: options.overlay.opacity,
        selectable: false
      });
      
      canvas.add(overlay);
    } catch (error) {
      console.error('Failed to setup background:', error);
      // Fallback to solid background
      canvas.backgroundColor = options.backgroundColor;
    }
  }

  /**
   * Add quote content to canvas
   */
  private async addContent(
    canvas: Canvas, 
    quote: QuoteWithAuthor, // Update type here
    options: Required<QuoteImageOptions>
  ): Promise<void> {
    const hasBackground = !!quote.backgroundImage;
    const textColor = hasBackground ? '#ffffff' : options.textColor;
    const fontSize = this.calculateFontSize(quote.content.length);

    // Add quote text
    const quoteText = new Textbox(`"${quote.content}"`, {
      width: options.width - (options.padding * 2),
      fontSize,
      fontFamily: options.fontFamily,
      fill: textColor,
      textAlign: 'center',
      top: options.padding,
      left: options.padding,
      selectable: false
    });

    // Add author name
    const authorText = new Text(`- ${quote.authorProfile.name}`, {
      fontSize: fontSize * 0.5,
      fontFamily: options.fontFamily,
      fill: textColor,
      left: options.padding,
      top: options.height - (options.padding * 2),
      selectable: false
    });

    // Add branding
    const brandingText = new Text(options.branding.text, {
      fontSize: options.branding.fontSize,
      fontFamily: options.fontFamily,
      fill: hasBackground ? '#ffffff' : options.branding.color,
      left: options.width - options.padding - 100,
      top: options.height - (options.padding * 2),
      selectable: false
    });

    // Add elements to canvas
    canvas.add(quoteText, authorText, brandingText);

    // Center quote text vertically
    const bounds = quoteText.getBoundingRect();
    const centerY = (options.height - bounds.height) / 2;
    quoteText.set('top', centerY);
  }

  /**
   * Load image from URL
   */
  private loadImage(url: string): Promise<Image> {
    return new Promise((resolve, reject) => {
      Image.fromURL(url, {
        crossOrigin: 'anonymous',
      }, (img: Image | null) => {
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
  private scaleImageToFill(image: Image, targetWidth: number, targetHeight: number): Image {
    const scale = Math.max(
      targetWidth / image.width!,
      targetHeight / image.height!
    );

    image.scale(scale);

    // Center the image
    image.set({
      left: (targetWidth - image.width! * scale) / 2,
      top: (targetHeight - image.height! * scale) / 2,
      selectable: false
    });

    return image;
  }
}

export const quoteImageService = new QuoteImageService();