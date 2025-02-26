// hooks/use-quote-download.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
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
    error: null
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
        { format }
      );

      setDownloadState(prev => ({ ...prev, progress: 75 }));

      // Create and trigger download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}.${format}`;
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
  }, [containerRef, filename, onPrepareDownload, onDownloadComplete]);

  return {
    downloadImage,
    isLoading: downloadState.isLoading,
    progress: downloadState.progress,
    error: downloadState.error
  };
}