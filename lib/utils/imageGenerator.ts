// lib/utils/imageGenerator.ts
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { registerFont } from '@/lib/canvas/register-font';

// Default system fonts as fallback
const FALLBACK_FONTS = ['Arial', 'Helvetica', 'sans-serif'];

// Define font family name
const FONT_FAMILY = 'Inter';

// Character count to font size mapping
const TEXT_SIZE_MAP: [number, number][] = [
  [700, 30], // text <= 700 char use 30px
  [600, 31], // text <= 600 char use 31px
  [550, 33], // text <= 550 char use 33px
  [500, 35], // text <= 500 char use 35px
  [450, 36], // text <= 450 char use 36px
  [400, 38], // text <= 400 char use 38px
  [350, 39], // text <= 350 char use 39px
  [300, 40], // text <= 300 char use 40px
  [240, 41], // text <= 240 char use 41px
  [100, 45], // text <= 100 char use 45px
];

// Register Inter font asynchronously
try {
  await registerFont(path.join(process.cwd(), 'public/fonts/Inter-Regular.ttf'), { 
    family: FONT_FAMILY 
  });
} catch (error) {
  console.warn('Failed to register custom font, using system fonts:', error);
}

interface GenerateQuoteImageOptions {
  content: string;
  author: string;
  siteName: string;
  backgroundUrl?: string | null;
}

export class QuoteImageGenerator {
  // Fixed dimensions as per requirements
  private readonly canvasWidth = 1080;
  private readonly canvasHeight = 1080;
  private readonly padding = 40;
  private readonly fontFamily = `${FONT_FAMILY}, ${FALLBACK_FONTS.join(', ')}`;

  /**
   * Calculate font size based on text length using the mapping
   */
  private calculateFontSize(text: string): number {
    const length = text.length;
    
    // Find the appropriate font size from the mapping
    const [, fontSize] = TEXT_SIZE_MAP.find(([maxLength]) => length <= maxLength) 
      ?? TEXT_SIZE_MAP[0]; // Default to smallest font size if text is too long

    return fontSize;
  }

  /**
   * Generate quote image with fixed dimensions
   */
  async generate({
    content,
    author,
    siteName,
    backgroundUrl,
  }: GenerateQuoteImageOptions): Promise<Buffer> {
    // Create canvas with fixed dimensions
    const canvas = createCanvas(this.canvasWidth, this.canvasHeight);
    const ctx = canvas.getContext('2d');

    // Draw background
    if (backgroundUrl) {
      try {
        const image = await loadImage(backgroundUrl);
        // Use cover/fill approach for background
        const scale = Math.max(
          this.canvasWidth / image.width,
          this.canvasHeight / image.height
        );
        const x = (this.canvasWidth - image.width * scale) / 2;
        const y = (this.canvasHeight - image.height * scale) / 2;
        
        ctx.drawImage(
          image,
          x, y,
          image.width * scale,
          image.height * scale
        );
        
        // Add dark overlay for better text readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      } catch (error) {
        console.error('Failed to load background image:', error);
        this.drawDefaultBackground(ctx);
      }
    } else {
      this.drawDefaultBackground(ctx);
    }

    // Calculate font size based on content length
    const fontSize = this.calculateFontSize(content);

    // Configure text rendering
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = `${fontSize}px ${this.fontFamily}`;

    // Word wrap and center text
    const maxWidth = this.canvasWidth - (this.padding * 2);
    const lines = this.wrapText(ctx, content, maxWidth);

    // Draw text lines
    const lineHeight = fontSize * 1.5;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (this.canvasHeight - totalTextHeight) / 2;

    lines.forEach((line, i) => {
      ctx.fillText(
        line,
        this.canvasWidth / 2,
        startY + (i * lineHeight)
      );
    });

    // Draw author
    ctx.font = `${fontSize * 0.4}px ${this.fontFamily}`;
    ctx.fillText(
      `― ${author}`,
      this.canvasWidth / 2,
      startY + totalTextHeight + (fontSize * 0.8)
    );

    // Draw site name
    ctx.font = `${fontSize * 0.25}px ${this.fontFamily}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(
      siteName,
      this.canvasWidth / 2,
      this.canvasHeight - (this.padding / 2)
    );

    // Return PNG buffer
    return canvas.toBuffer('image/png');
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
}

// Export singleton instance
export const quoteImageGenerator = new QuoteImageGenerator();