// hooks/use-quote-download.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { quoteDownloadService, QUALITY_PRESETS } from '@/lib/services/quote-download.service';

interface UseQuoteDownloadOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  onPrepareDownload?: () => void;
  onDownloadComplete?: () => void;
  filename?: string;
  initialQuality?: keyof typeof QUALITY_PRESETS;
}

interface DownloadState {
  isLoading: boolean;
  progress: number;
  error: Error | null;
  quality: keyof typeof QUALITY_PRESETS;
}

export function useQuoteDownload({
  containerRef,
  onPrepareDownload,
  onDownloadComplete,
  filename = 'quote',
  initialQuality = 'standard'
}: UseQuoteDownloadOptions) {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isLoading: false,
    progress: 0,
    error: null,
    quality: initialQuality
  });

  const downloadImage = useCallback(async (format: 'png' | 'jpg') => {
    if (!containerRef.current) {
      toast.error('Download container not found');
      return;
    }

    try {
      setDownloadState(prev => ({ ...prev, isLoading: true, progress: 0 }));
      onPrepareDownload?.();

      const dataUrl = await quoteDownloadService.generateImage(
        containerRef.current,
        {
          ...QUALITY_PRESETS[downloadState.quality],
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

      setDownloadState(prev => ({ ...prev, progress: 100, isLoading: false }));
      onDownloadComplete?.();
      toast.success('Download complete');

    } catch (error) {
      console.error('Download error:', error);
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
    onPrepareDownload,
    onDownloadComplete
  ]);

  return {
    downloadImage,
    setQuality: useCallback((quality: DownloadState['quality']) => {
      setDownloadState(prev => ({ ...prev, quality }));
    }, []),
    isLoading: downloadState.isLoading,
    progress: downloadState.progress,
    error: downloadState.error,
    quality: downloadState.quality
  };
}