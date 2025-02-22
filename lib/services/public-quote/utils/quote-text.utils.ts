interface TextSizeOptions {
  maxLength?: number;
  minFontSize?: number;
  maxFontSize?: number;
}

export const quoteTextUtils = {
  /**
   * Calculate optimal font size based on text length
   */
  calculateFontSize(textLength: number, options: TextSizeOptions = {}) {
    const {
      maxLength = 300,
      minFontSize = 0.875, // text-sm (14px)
      maxFontSize = 1.875  // text-3xl (30px)
    } = options;

    if (textLength > maxLength) return `${minFontSize}rem`;
    
    const ratio = 1 - (textLength / maxLength);
    const fontSize = minFontSize + ((maxFontSize - minFontSize) * ratio);
    
    return `${fontSize.toFixed(3)}rem`;
  },

  /**
   * Truncate text with ellipsis
   */
  truncateText(text: string, limit: number): string {
    if (text.length <= limit) return text;
    return text.slice(0, limit) + '...';
  },

  /**
   * Get text classification based on length
   */
  getTextClass(length: number): string {
    if (length > 300) return "text-sm md:text-base";
    if (length > 200) return "text-base md:text-lg";
    if (length > 100) return "text-lg md:text-xl";
    return "text-xl md:text-2xl lg:text-3xl";
  }
};