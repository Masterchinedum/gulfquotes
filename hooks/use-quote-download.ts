// hooks/use-quote-download.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
// import type { Gallery } from '@prisma/client';
import { quoteDownloadService } from '@/lib/services/quote-download.service';

interface UseQuoteDownloadOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  onPrepareDownload?: () => void;
  onDownloadComplete?: () => void;
  filename?: string;
}

interface DownloadState {
  isLoading: boolean;
  progress: number;
  error: Error | null;
  quality: 'high' | 'standard' | 'web';
}

export function useQuoteDownload({
  containerRef,
  onPrepareDownload,
  onDownloadComplete,
  filename = 'quote'
}: UseQuoteDownloadOptions) {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isLoading: false,
    progress: 0,
    error: null,
    quality: 'standard'
  });

  // Update quality setting
  const setQuality = useCallback((quality: DownloadState['quality']) => {
    setDownloadState(prev => ({ ...prev, quality }));
  }, []);

  // Handle download preparation
  const prepareDownload = useCallback(async () => {
    if (!containerRef.current) return;

    setDownloadState(prev => ({ 
      ...prev, 
      isLoading: true, 
      progress: 0,
      error: null 
    }));

    try {
      onPrepareDownload?.();

      // Wait for fonts to load
      await document.fonts.ready;

      // Wait for images
      const images = containerRef.current.getElementsByTagName('img');
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>(resolve => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );

      setDownloadState(prev => ({ ...prev, progress: 50 }));

    } catch (error) {
      setDownloadState(prev => ({ 
        ...prev, 
        error: error as Error,
        isLoading: false 
      }));
      toast.error('Failed to prepare download');
    }
  }, [containerRef, onPrepareDownload]);

  // Handle download process
  const downloadImage = useCallback(async (format: 'png' | 'jpg') => {
    if (!containerRef.current) {
      toast.error('Download container not found');
      return;
    }

    try {
      await prepareDownload();

      // Generate image with current quality settings
      const dataUrl = await quoteDownloadService.generateImage(
        containerRef.current,
        {
          ...quoteDownloadService.QUALITY_PRESETS[downloadState.quality],
          format
        }
      );

      setDownloadState(prev => ({ ...prev, progress: 75 }));

      // Create and trigger download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}-${downloadState.quality}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadState(prev => ({ 
        ...prev, 
        progress: 100,
        isLoading: false 
      }));

      toast.success('Image downloaded successfully');
      onDownloadComplete?.();

    } catch (error) {
      setDownloadState(prev => ({ 
        ...prev, 
        error: error as Error,
        isLoading: false 
      }));
      toast.error('Failed to download image');
      onDownloadComplete?.();
    }
  }, [
    containerRef,
    downloadState.quality,
    filename,
    onDownloadComplete,
    prepareDownload
  ]);

  return {
    downloadImage,
    setQuality,
    isLoading: downloadState.isLoading,
    progress: downloadState.progress,
    error: downloadState.error,
    quality: downloadState.quality
  };
}