// lib/utils/imageGenerator.ts
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { registerFont } from '@/lib/canvas/register-font';

// Default system fonts as fallback
const FALLBACK_FONTS = ['Arial', 'Helvetica', 'sans-serif'];

// Define font family name
const FONT_FAMILY = 'Inter';

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
  width?: number;
  height?: number;
}

export class QuoteImageGenerator {
  private readonly defaultWidth = 1200;
  private readonly defaultHeight = 1200;
  private readonly padding = 60;
  private readonly maxFontSize = 72;
  private readonly minFontSize = 24;
  private readonly fontFamily = `${FONT_FAMILY}, ${FALLBACK_FONTS.join(', ')}`;

  /**
   * Calculate optimal font size based on text length and container size
   */
  private calculateFontSize(text: string, maxWidth: number, maxHeight: number): number {
    const length = text.length;
    let fontSize = this.maxFontSize;

    // Base scaling on text length
    if (length > 100) {
      fontSize = Math.max(
        this.minFontSize,
        Math.floor(fontSize * (100 / length) * 1.5)
      );
    }

    // Further adjust based on container dimensions
    const availableWidth = maxWidth - (this.padding * 2);
    const availableHeight = maxHeight - (this.padding * 4); // Extra padding for author and site name
    
    // Reduce font size if it would exceed container
    while (fontSize > this.minFontSize) {
      const measuredHeight = (fontSize * 1.5) * Math.ceil(text.length * fontSize / availableWidth);
      if (measuredHeight <= availableHeight) break;
      fontSize -= 2;
    }

    return fontSize;
  }

  /**
   * Generate quote image with dynamic text scaling
   */
  async generate({
    content,
    author,
    siteName,
    backgroundUrl,
    width = this.defaultWidth,
    height = this.defaultHeight
  }: GenerateQuoteImageOptions): Promise<Buffer> {
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw background
    if (backgroundUrl) {
      try {
        const image = await loadImage(backgroundUrl);
        ctx.drawImage(image, 0, 0, width, height);
        // Add dark overlay for better text readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);
      } catch (error) {
        console.error('Failed to load background image:', error);
        // Fallback to gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#2a2a2a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      // Default gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(1, '#2a2a2a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Calculate optimal font size
    const fontSize = this.calculateFontSize(
      content,
      width - (this.padding * 2),
      height - (this.padding * 4)
    );

    // Draw quote text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = `${fontSize}px ${this.fontFamily}`;

    // Word wrap and center text
    const words = content.split(' ');
    let line = '';
    const lines: string[] = [];
    const maxWidth = width - (this.padding * 2);

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line) {
        lines.push(line.trim());
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    // Draw text lines
    const lineHeight = fontSize * 1.5;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (height - totalTextHeight) / 2;

    lines.forEach((line, i) => {
      ctx.fillText(
        line,
        width / 2,
        startY + (i * lineHeight)
      );
    });

    // Draw author
    ctx.font = `${fontSize * 0.4}px ${this.fontFamily}`;
    ctx.fillText(
      `― ${author}`,
      width / 2,
      startY + totalTextHeight + (fontSize * 0.8)
    );

    // Draw site name
    ctx.font = `${fontSize * 0.25}px ${this.fontFamily}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(
      siteName,
      width / 2,
      height - (this.padding / 2)
    );

    // Return PNG buffer
    return canvas.toBuffer();
  }
}

// Export singleton instance
export const quoteImageGenerator = new QuoteImageGenerator();