// lib/utils/imageGenerator.ts
import { createCanvas, loadImage, CanvasRenderingContext2D, Canvas } from 'canvas';
import path from 'path';
import { registerFont } from '@/lib/canvas/register-font';

// Default system fonts as fallback
const FALLBACK_FONTS = ['Arial', 'Helvetica', 'sans-serif'];

// Define font family name
const FONT_FAMILY = 'Inter';

// Character count to font size mapping
const TEXT_SIZE_MAP: [number, number][] = [
  [1000, 25], // text <= 1000 char use 25px
  [900, 27],  // text <= 900 char use 27px
  [800, 28],  // text <= 800 char use 28px
  [700, 30],  // text <= 700 char use 30px
  [600, 31],  // text <= 600 char use 31px
  [550, 33],  // text <= 550 char use 33px
  [500, 35],  // text <= 500 char use 35px
  [450, 36],  // text <= 450 char use 36px
  [400, 38],  // text <= 400 char use 38px
  [350, 39],  // text <= 350 char use 39px
  [300, 40],  // text <= 300 char use 40px
  [240, 41],  // text <= 240 char use 41px
  [100, 45],  // text <= 100 char use 45px
];

interface GenerateQuoteImageOptions {
  content: string;
  author: string;
  siteName: string;
  backgroundUrl?: string | null;
}

interface TextMetrics {
  lines: string[];
  fontSize: number;
  lineHeight: number;
  totalHeight: number;
}

export class QuoteImageGenerator {
  private readonly canvasWidth = 1080;
  private readonly canvasHeight = 1080;
  private readonly padding = 40;
  private readonly fontFamily = `${FONT_FAMILY}, ${FALLBACK_FONTS.join(', ')}`;
  private readonly overlayOpacity = 0.5;
  private fontLoaded: boolean = false;

  constructor() {
    // Register font in constructor
    registerFont(
      path.join(process.cwd(), 'public/fonts/Inter-Regular.ttf'),
      { family: FONT_FAMILY }
    ).then(() => {
      this.fontLoaded = true;
    }).catch(error => {
      console.warn('Failed to register custom font, using system fonts:', error);
      this.fontLoaded = false;
    });
  }

  /**
   * Create initial staging canvas at 1080x1080
   */
  private createStagingCanvas(): [Canvas, CanvasRenderingContext2D] {
    const canvas = createCanvas(this.canvasWidth, this.canvasHeight);
    const ctx = canvas.getContext('2d');
    return [canvas, ctx];
  }

  /**
   * Calculate font size and prepare text layout
   */
  private calculateTextMetrics(ctx: CanvasRenderingContext2D, text: string): TextMetrics {
    // Calculate font size based on text length
    const fontSize = this.calculateFontSize(text);
    const maxWidth = this.canvasWidth - (this.padding * 2);

    // Configure context for text measurement
    ctx.font = `${fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Perform text wrapping
    const lines = this.wrapText(ctx, text, maxWidth);
    const lineHeight = fontSize * 1.5;
    const totalHeight = lines.length * lineHeight;

    return {
      lines,
      fontSize,
      lineHeight,
      totalHeight
    };
  }

  /**
   * Process and draw background image with overlay
   */
  private async drawBackground(
    ctx: CanvasRenderingContext2D, 
    backgroundUrl: string | null | undefined
  ): Promise<void> {
    if (backgroundUrl) {
      try {
        const image = await loadImage(backgroundUrl);
        
        // Calculate scaling to cover 1080x1080
        const scale = Math.max(
          this.canvasWidth / image.width,
          this.canvasHeight / image.height
        );

        // Calculate positioning for center
        const x = (this.canvasWidth - image.width * scale) / 2;
        const y = (this.canvasHeight - image.height * scale) / 2;
        
        // Draw image
        ctx.drawImage(
          image,
          x, y,
          image.width * scale,
          image.height * scale
        );
        
        // Add semi-transparent overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${this.overlayOpacity})`;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      } catch (error) {
        console.error('Failed to load background image:', error);
        this.drawDefaultBackground(ctx);
      }
    } else {
      this.drawDefaultBackground(ctx);
    }
  }

  /**
   * Draw the quote text content
   */
  private drawQuoteContent(
    ctx: CanvasRenderingContext2D,
    content: string,
    author: string,
    siteName: string
  ): void {
    // Calculate text metrics
    const metrics = this.calculateTextMetrics(ctx, content);
    const { lines, fontSize, lineHeight, totalHeight } = metrics;

    // Calculate vertical positioning
    const startY = (this.canvasHeight - totalHeight) / 2;

    // Draw main quote text
    ctx.fillStyle = '#ffffff';
    lines.forEach((line, i) => {
      ctx.fillText(
        line,
        this.canvasWidth / 2,
        startY + (i * lineHeight)
      );
    });

    // Draw author attribution
    const authorFontSize = fontSize * 0.4;
    ctx.font = `${authorFontSize}px ${this.fontFamily}`;
    ctx.fillText(
      `― ${author}`,
      this.canvasWidth / 2,
      startY + totalHeight + (fontSize * 0.8)
    );

    // Draw site name
    const siteNameFontSize = fontSize * 0.25;
    ctx.font = `${siteNameFontSize}px ${this.fontFamily}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(
      siteName,
      this.canvasWidth / 2,
      this.canvasHeight - (this.padding / 2)
    );
  }

  /**
   * Calculate font size based on text length using the mapping
   */
  private calculateFontSize(text: string): number {
    const length = text.length;
    
    if (length > 1000) {
      return 20; // Default smallest size for very long text
    }
    
    // Find the appropriate font size from the mapping
    const [, fontSize] = TEXT_SIZE_MAP.find(([maxLength]) => length <= maxLength) 
      ?? [0, 20]; // Fallback size if no match found

    return fontSize;
  }

  /**
   * Draw default gradient background
   */
  private drawDefaultBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  /**
   * Wrap text into lines that fit within maxWidth
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    return lines;
  }

  /**
   * Generate quote image
   */
  async generate(options: GenerateQuoteImageOptions): Promise<Buffer> {
    // Wait for font to be ready
    if (!this.fontLoaded) {
      console.warn('Using fallback fonts as custom font failed to load');
    }

    const [canvas, ctx] = this.createStagingCanvas();
    
    // Process background and overlay
    await this.drawBackground(ctx, options.backgroundUrl);
    
    // Draw quote content
    this.drawQuoteContent(ctx, options.content, options.author, options.siteName);
    
    // Return final image buffer
    return canvas.toBuffer('image/png');
  }
}

// Export singleton instance
export const quoteImageGenerator = new QuoteImageGenerator();