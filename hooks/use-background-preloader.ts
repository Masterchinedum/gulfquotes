import { useState, useRef, useCallback, useEffect } from "react";
import { Gallery } from "@prisma/client";

// Global image cache shared across hook instances
const globalImageCache = new Map<string, boolean>();

interface BackgroundPreloaderOptions {
  initialImages?: Gallery[];           // Images to preload immediately
  priorityImages?: Gallery[];          // Images to load with higher priority
  cacheSize?: number;                 // Max number of images to cache (optional)
  onProgress?: (progress: number) => void; // Progress callback
}

/**
 * Hook for efficient background image preloading and caching
 */
export function useBackgroundPreloader(options?: BackgroundPreloaderOptions) {
  // State for tracking loading status of each image
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // Total loading progress (0-100)
  const [progress, setProgress] = useState(100);
  
  // Keep track of pending loads to calculate progress
  const pendingLoads = useRef<Set<string>>(new Set());
  const totalLoads = useRef<number>(0);

  // Function to preload a single image
  const preloadImage = useCallback((background: Gallery): Promise<boolean> => {
    // Skip if no URL
    if (!background.url) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      // Skip if already loaded
      if (globalImageCache.has(background.url)) {
        resolve(true);
        return;
      }
      
      // Mark as loading
      setLoadingStates(prev => ({ ...prev, [background.id]: true }));
      pendingLoads.current.add(background.url);
      totalLoads.current++;
      
      // Update progress
      const updateProgress = () => {
        const pending = pendingLoads.current.size;
        const total = Math.max(totalLoads.current, 1); // Avoid division by zero
        const newProgress = Math.round(((total - pending) / total) * 100);
        setProgress(newProgress);
        options?.onProgress?.(newProgress);
      };
      
      updateProgress();
      
      // Create image and set handlers
      const img = new Image();
      
      img.onload = () => {
        globalImageCache.set(background.url, true);
        setLoadingStates(prev => ({ ...prev, [background.id]: false }));
        pendingLoads.current.delete(background.url);
        updateProgress();
        resolve(true);
      };
      
      img.onerror = () => {
        setLoadingStates(prev => ({ ...prev, [background.id]: false }));
        pendingLoads.current.delete(background.url);
        updateProgress();
        resolve(false);
      };
      
      // Start loading
      img.src = background.url;
    });
  }, [options]);

  // Function to preload multiple images with priority handling
  const preloadImages = useCallback((backgrounds: Gallery[], highPriority = false) => {
    if (backgrounds.length === 0) return Promise.resolve({});
    
    // If high priority, load sequentially for faster critical path
    if (highPriority) {
      const promises = backgrounds.reduce(
        (chain, background) => chain.then(() => preloadImage(background)),
        Promise.resolve(true)
      );
      return promises;
    }
    
    // Otherwise load in parallel
    const promises = backgrounds.map(background => preloadImage(background));
    return Promise.all(promises);
  }, [preloadImage]);

  // Function to prefetch images at lower priority
  const prefetchImages = useCallback((backgrounds: Gallery[]) => {
    if (typeof window === 'undefined' || !backgrounds.length) return;
    
    if (!window.requestIdleCallback) {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => preloadImages(backgrounds), 200);
      return;
    }
    
    window.requestIdleCallback(() => {
      preloadImages(backgrounds);
    }, { timeout: 2000 });
  }, [preloadImages]);

  // Limit cache size if specified
  useEffect(() => {
    if (!options?.cacheSize) return;
    
    if (globalImageCache.size > options.cacheSize) {
      // Simple LRU-like eviction - remove oldest entries
      const entriesToRemove = globalImageCache.size - options.cacheSize;
      const keys = Array.from(globalImageCache.keys());
      
      for (let i = 0; i < entriesToRemove; i++) {
        globalImageCache.delete(keys[i]);
      }
    }
  }, [options?.cacheSize]);

  // Preload initial and priority images on mount
  useEffect(() => {
    const initialBackgrounds = options?.initialImages || [];
    const priorityBackgrounds = options?.priorityImages || [];
    
    // Load priority images first, sequentially
    if (priorityBackgrounds.length > 0) {
      preloadImages(priorityBackgrounds, true);
    }
    
    // Load other initial images in parallel
    const nonPriorityBackgrounds = initialBackgrounds.filter(
      bg => !priorityBackgrounds.some(p => p.id === bg.id)
    );
    
    if (nonPriorityBackgrounds.length > 0) {
      preloadImages(nonPriorityBackgrounds);
    }
  }, [options?.initialImages, options?.priorityImages, preloadImages]);

  return {
    isLoading: (background: Gallery) => loadingStates[background.id] === true,
    isLoaded: (background: Gallery) => background && background.url ? globalImageCache.has(background.url) : false,
    loadingStates,
    progress,
    preloadImage,
    preloadImages,
    prefetchImages,
    clearCache: () => {
      globalImageCache.clear();
      pendingLoads.current.clear();
      totalLoads.current = 0;
      setLoadingStates({});
      setProgress(100);
    },
    getCachedUrls: () => Array.from(globalImageCache.keys())
  };
}