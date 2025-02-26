// hooks/use-viewport-scale.ts
import { useEffect, useState, useCallback } from "react";

interface ViewportScale {
  scale: number;
  containerWidth: number;
  containerHeight: number;
  contentScale: number;
}

interface ViewportScaleOptions {
  targetWidth: number;
  targetHeight: number;
  minScale?: number;
  maxScale?: number;
  padding?: number;
}

export function useViewportScale(
  containerRef: React.RefObject<HTMLElement>,
  options: ViewportScaleOptions
): ViewportScale {
  const [dimensions, setDimensions] = useState<ViewportScale>({
    scale: 1,
    containerWidth: options.targetWidth,
    containerHeight: options.targetHeight,
    contentScale: 1
  });

  // Calculate scale based on container size
  const calculateScale = useCallback(() => {
    if (!containerRef.current?.parentElement) return;

    const parent = containerRef.current.parentElement;
    const parentWidth = parent.offsetWidth;
    const parentHeight = parent.offsetHeight;

    // Calculate scale while maintaining aspect ratio
    const horizontalScale = parentWidth / options.targetWidth;
    const verticalScale = parentHeight / options.targetHeight;
    const scale = Math.min(
      horizontalScale,
      verticalScale,
      options.maxScale || Infinity
    );

    // Ensure scale doesn't go below minimum
    const finalScale = Math.max(scale, options.minScale || 0);

    // Calculate container dimensions
    const containerWidth = parentWidth;
    const containerHeight = parentWidth; // Maintain 1:1 aspect ratio

    // Calculate content scale (for font sizes, padding, etc.)
    const contentScale = containerWidth / options.targetWidth;

    setDimensions({
      scale: finalScale,
      containerWidth,
      containerHeight,
      contentScale
    });
  }, [
    options.targetWidth,
    options.targetHeight,
    options.minScale,
    options.maxScale
  ]);

  // Handle resize events
  useEffect(() => {
    if (!containerRef.current?.parentElement) return;

    // Initial calculation
    calculateScale();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      calculateScale();
    });

    resizeObserver.observe(containerRef.current.parentElement);

    // Clean up
    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateScale]);

  return dimensions;
}