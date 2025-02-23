// lib/canvas/register-font.ts
interface FontOptions {
  family: string;
  weight?: string;
  style?: string;
}

export async function registerFont(fontPath: string, options: FontOptions): Promise<void> {
  // In Node.js environment, use canvas
  if (typeof window === 'undefined') {
    try {
      // Dynamic import for canvas in Node environment only
      const { registerFont } = await import('canvas');
      
      // Validate font path exists
      const fs = await import('fs');
      if (!fs.existsSync(fontPath)) {
        throw new Error(`Font file not found: ${fontPath}`);
      }

      registerFont(fontPath, options);
    } catch (error) {
      console.warn('Failed to register font:', error);
      // Continue without custom font, will use system fonts
    }
  }
  // In browser environment, do nothing (fonts handled by CSS)
}