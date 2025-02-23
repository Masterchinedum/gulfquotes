// lib/canvas/register-font.ts
interface FontOptions {
  family: string;
  weight?: string;
  style?: string;
}

export async function registerFont(path: string, options: FontOptions): Promise<void> {
  // In Node.js environment, use canvas
  if (typeof window === 'undefined') {
    try {
      // Dynamic import for canvas in Node environment only
      const { registerFont } = await import('canvas');
      registerFont(path, options);
    } catch (error) {
      console.warn('Failed to register font:', error);
    }
  }
  // In browser environment, do nothing (fonts handled by CSS)
}