// components/responsive-container.tsx
"use client"

import React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  aspectRatio?: number;
  maxWidth?: number;
  minScale?: number;
  maxScale?: number;
  className?: string;
  containerClassName?: string;
}

export function ResponsiveContainer({
  children,
  aspectRatio = 1, // Default to square (1:1)
  maxWidth = 1080,
  minScale = 0.1,
  maxScale = 1,
  className,
  containerClassName,
}: ResponsiveContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [containerWidth, setContainerWidth] = React.useState(maxWidth);

  // Update scale and container width on resize
  React.useEffect(() => {
    if (!containerRef.current?.parentElement) return;

    const updateDimensions = () => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;

      // Get available width (accounting for padding/margins)
      const availableWidth = parent.offsetWidth;
      
      // Calculate new width (respecting maxWidth)
      const newWidth = Math.min(availableWidth, maxWidth);
      
      // Calculate new scale
      const baseScale = newWidth / maxWidth;
      const newScale = Math.min(
        Math.max(baseScale, minScale), 
        maxScale
      );

      setScale(newScale);
      setContainerWidth(newWidth);
    };

    // Initial calculation
    updateDimensions();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current.parentElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [maxWidth, minScale, maxScale]);

  return (
    <div
      className={cn(
        "w-full mx-auto overflow-hidden",
        containerClassName
      )}
      style={{
        width: `${containerWidth}px`, // Use containerWidth here
        maxWidth: `${maxWidth}px`
      }}
    >
      {/* Aspect ratio container */}
      <div
        className={cn(
          "relative w-full",
          className
        )}
        style={{
          paddingBottom: `${(1 / aspectRatio) * 100}%`, // Maintain aspect ratio
          height: aspectRatio === 1 ? `${containerWidth}px` : undefined // Use containerWidth for square aspect ratio
        }}
      >
        {/* Scaled content container */}
        <div
          ref={containerRef}
          className="absolute inset-0"
        >
          <div 
            className="relative w-full h-full transform-gpu"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: `${maxWidth}px`, // Set fixed width for scaling
              height: aspectRatio === 1 ? `${maxWidth}px` : undefined // Set fixed height for square
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A specialized version of ResponsiveContainer for 1:1 square content
 */
export function SquareContainer({
  children,
  maxWidth = 1080,
  className,
  ...props
}: Omit<ResponsiveContainerProps, 'aspectRatio'>) {
  return (
    <ResponsiveContainer
      aspectRatio={1}
      maxWidth={maxWidth}
      className={cn("aspect-square", className)}
      {...props}
    >
      {children}
    </ResponsiveContainer>
  );
}