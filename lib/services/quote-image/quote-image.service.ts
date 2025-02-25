import { fabric } from 'fabric';
import type { Quote, AuthorProfile } from "@prisma/client";

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
    fontSize: 30,
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

  async createImage(quote: QuoteWithAuthor, options?: QuoteImageOptions): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    
    if (typeof window === 'undefined') {
      throw new Error('Quote image generation is only available in the browser');
    }

    const canvasEl = document.createElement('canvas');
    const canvas = new fabric.Canvas(canvasEl, {
      width: opts.width,
      height: opts.height
    });

    if (quote.backgroundImage) {
      await this.setupBackground(canvas, quote.backgroundImage, opts);
    } else {
      canvas.backgroundColor = opts.backgroundColor;
    }

    await this.addContent(canvas, quote, opts);

    canvas.renderAll();
    return canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    });
  }

  private async setupBackground(
    canvas: fabric.Canvas, 
    imageUrl: string, 
    options: Required<QuoteImageOptions>
  ): Promise<void> {
    try {
      const bgImage = await this.loadImage(imageUrl);
      const scaled = this.scaleImageToFill(bgImage, options.width, options.height);
      
      canvas.setBackgroundImage(scaled, canvas.renderAll.bind(canvas));
      
      const overlay = new fabric.Rect({
        width: options.width,
        height: options.height,
        fill: options.overlay.color,
        opacity: options.overlay.opacity,
        selectable: false
      });
      
      canvas.add(overlay);
    } catch (error) {
      console.error('Failed to setup background:', error);
      canvas.backgroundColor = options.backgroundColor;
    }
  }

  private loadImage(url: string): Promise<fabric.Image> {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(url, (img) => {
        if (img) {
          resolve(img);
        } else {
          reject(new Error('Failed to load image'));
        }
      }, {
        crossOrigin: 'anonymous' // Move options to third parameter
      });
    });
  }

  private scaleImageToFill(image: fabric.Image, targetWidth: number, targetHeight: number): fabric.Image {
    const scale = Math.max(
      targetWidth / image.width!,
      targetHeight / image.height!
    );

    image.scale(scale);

    image.set({
      left: (targetWidth - image.width! * scale) / 2,
      top: (targetHeight - image.height! * scale) / 2,
      selectable: false
    });

    return image;
  }

  private async addContent(
    canvas: fabric.Canvas,
    quote: QuoteWithAuthor,
    options: Required<QuoteImageOptions>
  ): Promise<void> {
    const hasBackground = !!quote.backgroundImage;
    const textColor = hasBackground ? '#ffffff' : options.textColor;
    const fontSize = options.fontSize;

    // Add quote text
    const quoteText = new fabric.Textbox(`"${quote.content}"`, {
      width: options.width - options.padding * 2,
      fontSize,
      fontFamily: options.fontFamily,
      fill: textColor,
      textAlign: 'center',
      top: options.padding,
      left: options.padding,
      selectable: false
    });

    // Add author text
    const authorText = new fabric.Text(`- ${quote.authorProfile.name}`, {
      fontSize: fontSize * 0.5,
      fontFamily: options.fontFamily,
      fill: textColor,
      textAlign: 'center',
      top: options.height - options.padding - (fontSize * 0.5),
      left: options.padding,
      selectable: false
    });

    // Add branding text if specified
    if (options.branding?.text) {
      // Destructure default branding fontSize for fallback
      const { fontSize: defaultBrandingSize } = this.defaultOptions.branding;
      // Type assertion here since we know defaultBrandingSize is defined
      const brandingFontSize = (options.branding.fontSize ?? defaultBrandingSize) as number;
      
      const brandingText = new fabric.Text(options.branding.text, {
        fontSize: brandingFontSize,
        fontFamily: options.fontFamily,
        fill: options.branding.color ?? this.defaultOptions.branding.color,
        textAlign: 'center',
        top: options.height - options.padding - brandingFontSize,
        left: options.width - options.padding - 100,
        selectable: false
      });
      canvas.add(brandingText);
    }

    // Add elements to canvas
    canvas.add(quoteText, authorText);

    // Center elements horizontally
    canvas.getObjects().forEach(obj => {
      if (obj.get('type') !== 'rect') { // Skip overlay rectangle
        canvas.centerObjectH(obj);
      }
    });
  }
}

export const quoteImageService = new QuoteImageService();