import { useState, useCallback } from "react";
import type { Quote, AuthorProfile } from "@prisma/client";
import type { GalleryItem } from "@/types/gallery";

interface QuoteCustomizationOptions {
  minFontSize?: number;
  maxFontSize?: number;
  defaultFontSize?: number;
}

interface CustomizationState {
  fontSize: number;
  background: {
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
  };
  isGenerating: boolean;
  imageUrl: string | null;
  error: string | null;
}

export function useQuoteCustomization(
  quote: Quote & { authorProfile: AuthorProfile },
  options: QuoteCustomizationOptions = {}
) {
  const [state, setState] = useState<CustomizationState>({
    fontSize: options.defaultFontSize || 30,
    background: {
      imageUrl: quote.backgroundImage,
      isLoading: false,
      error: null
    },
    isGenerating: false,
    imageUrl: null,
    error: null
  });

  // Update font size
  const setFontSize = useCallback((size: number) => {
    setState(prev => ({
      ...prev,
      fontSize: Math.min(
        Math.max(size, options.minFontSize || 20),
        options.maxFontSize || 45
      )
    }));
  }, [options.minFontSize, options.maxFontSize]);

  // Update background image
  const setBackground = useCallback(async (image: GalleryItem) => {
    setState(prev => ({
      ...prev,
      background: {
        ...prev.background,
        isLoading: true,
        error: null
      }
    }));

    try {
      const response = await fetch(`/api/quotes/${quote.slug}/background`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: image.url })
      });

      if (!response.ok) {
        throw new Error('Failed to update background');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        background: {
          imageUrl: data.data.backgroundImage,
          isLoading: false,
          error: null
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        background: {
          ...prev.background,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to update background'
        }
      }));
    }
  }, [quote.slug]);

  // Remove background
  const removeBackground = useCallback(async () => {
    setState(prev => ({
      ...prev,
      background: {
        ...prev.background,
        isLoading: true,
        error: null
      }
    }));

    try {
      const response = await fetch(`/api/quotes/${quote.slug}/background`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: null })
      });

      if (!response.ok) {
        throw new Error('Failed to remove background');
      }

      // Remove data const since we don't need it
      setState(prev => ({
        ...prev,
        background: {
          imageUrl: null,
          isLoading: false,
          error: null
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        background: {
          ...prev.background,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to remove background'
        }
      }));
    }
  }, [quote.slug]);

  // Generate quote image
  const generateImage = useCallback(async () => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const imageData = await [`quoteImageService`](lib/services/quote-image/quote-image.service.ts).createImage(quote, {
        width: 1080,
        height: 1080,
        padding: 40,
        backgroundColor: '#ffffff',
        textColor: state.background.imageUrl ? '#ffffff' : '#000000',
        fontFamily: 'Inter',
        fontSize: state.fontSize,
        branding: {
          text: 'Quoticon',
          color: state.background.imageUrl ? '#ffffff' : '#666666',
          fontSize: 24
        }
      });

      setState(prev => ({
        ...prev,
        isGenerating: false,
        imageUrl: imageData,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate image'
      }));
    }
  }, [quote, state.background.imageUrl, state.fontSize]);

  return {
    fontSize: state.fontSize,
    setFontSize,
    background: state.background,
    setBackground,
    removeBackground,
    isGenerating: state.isGenerating,
    imageUrl: state.imageUrl,
    error: state.error,
    generateImage
  };
}