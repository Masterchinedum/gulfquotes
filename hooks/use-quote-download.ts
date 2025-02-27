// hooks/use-quote-download.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { quoteDownloadService } from '@/lib/services/quote-download.service';

interface UseQuoteDownloadOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  onPrepareDownload?: () => void;
  onDownloadComplete?: () => void;
  filename?: string;
  quoteSlug?: string; // Add this parameter to identify the quote
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
  filename = 'quote',
  quoteSlug // Add the quote slug parameter
}: UseQuoteDownloadOptions) {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isLoading: false,
    progress: 0,
    error: null
  });

  // Add tracking function to send a request to the tracking endpoint
  const trackDownload = useCallback(async (slug: string) => {
    try {
      await fetch(`/api/quotes/${slug}/track-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      // No need to handle response - we don't want to affect user experience
      console.log('Download tracked successfully');
    } catch (error) {
      // Just log the error - don't show to user or affect download flow
      console.error('Failed to track download:', error);
    }
  }, []);

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

      // Track the download after it has started
      if (quoteSlug) {
        // Don't await this - we want it to happen in background
        trackDownload(quoteSlug);
      }

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
  }, [containerRef, filename, onPrepareDownload, onDownloadComplete, quoteSlug, trackDownload]);

  return {
    downloadImage,
    isLoading: downloadState.isLoading,
    progress: downloadState.progress,
    error: downloadState.error
  };
}
