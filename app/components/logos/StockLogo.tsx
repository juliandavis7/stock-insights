/**
 * Centralized Stock Logo Component
 * 
 * This component provides consistent logo styling across the application.
 * Adjust logo settings (size, background, zoom, etc.) in one place.
 */

import React from 'react';

// Centralized logo configuration - adjust settings here
export const LOGO_CONFIG = {
  // Size settings
  containerSize: 24, // Container size in pixels (w-6 h-6 = 24px)
  imageSize: 16, // Image size within container (w-4 h-4 = 16px)
  
  // Background settings
  backgroundColor: '#d1d5db', // Gray background
  borderColor: undefined, // Set to a color string to enable border, undefined to disable
  borderWidth: 0, // Border width in pixels
  
  // Shadow settings
  shadow: 'shadow-sm', // Tailwind shadow class, or undefined to disable
  
  // Image settings
  objectFit: 'contain' as const, // 'contain' | 'cover' | 'fill'
  referrerPolicy: 'no-referrer' as const,
  
  // CSS filter for image (e.g., 'brightness(0.8) contrast(1.2)')
  imageFilter: undefined as string | undefined,
  
  // Fallback settings
  showFallback: true, // Show ticker initial if image fails to load
  fallbackFontSize: 'text-xs', // Tailwind class for fallback text size
  fallbackTextColor: 'text-gray-500', // Tailwind class for fallback text color
};

interface StockLogoProps {
  ticker: string;
  className?: string;
  containerClassName?: string;
  imageClassName?: string;
  size?: number; // Override container size
  imageSize?: number; // Override image size
  backgroundColor?: string; // Override background color
  showFallback?: boolean; // Override fallback display
}

export function StockLogo({
  ticker,
  className = '',
  containerClassName = '',
  imageClassName = '',
  size,
  imageSize,
  backgroundColor,
  showFallback = LOGO_CONFIG.showFallback,
}: StockLogoProps) {
  const containerSize = size ?? LOGO_CONFIG.containerSize;
  const imgSize = imageSize ?? LOGO_CONFIG.imageSize;
  const bgColor = backgroundColor ?? LOGO_CONFIG.backgroundColor;
  const borderStyle = LOGO_CONFIG.borderColor && LOGO_CONFIG.borderWidth > 0
    ? { border: `${LOGO_CONFIG.borderWidth}px solid ${LOGO_CONFIG.borderColor}` }
    : {};
  const shadowClass = LOGO_CONFIG.shadow || '';
  
  return (
    <div
      className={`rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ${shadowClass} ${containerClassName} ${className}`}
      style={{
        width: containerSize,
        height: containerSize,
        backgroundColor: bgColor,
        ...borderStyle,
      }}
    >
      <img
        src={`https://financialmodelingprep.com/image-stock/${ticker}.png`}
        alt={`${ticker} logo`}
        className={`object-${LOGO_CONFIG.objectFit} ${imageClassName}`}
        style={{
          width: imgSize,
          height: imgSize,
          filter: LOGO_CONFIG.imageFilter,
        }}
        referrerPolicy={LOGO_CONFIG.referrerPolicy}
        onError={(e) => {
          // Hide the image to reveal the fallback initial behind it
          e.currentTarget.style.display = 'none';
          // Show the fallback initial
          if (showFallback) {
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }
        }}
      />
      {showFallback && (
        <span
          className={`${LOGO_CONFIG.fallbackFontSize} font-semibold ${LOGO_CONFIG.fallbackTextColor} hidden items-center justify-center w-full h-full`}
          style={{ display: 'none' }}
        >
          {ticker.charAt(0)}
        </span>
      )}
    </div>
  );
}

/**
 * Helper function to get logo styles for SVG contexts (like pie charts)
 * Returns an object with styles that can be applied to SVG elements
 */
export function getLogoSvgStyles(size?: number) {
  const logoSize = size ?? LOGO_CONFIG.imageSize;
  const containerSize = logoSize + 4; // Add padding
  
  return {
    container: {
      width: containerSize,
      height: containerSize,
      backgroundColor: LOGO_CONFIG.backgroundColor,
      borderColor: LOGO_CONFIG.borderColor,
      borderWidth: LOGO_CONFIG.borderWidth,
      borderRadius: '0.5rem', // rounded-lg equivalent (8px)
    },
    image: {
      width: logoSize,
      height: logoSize,
      filter: LOGO_CONFIG.imageFilter,
    },
  };
}

/**
 * Get the logo URL for a ticker
 */
export function getLogoUrl(ticker: string): string {
  return `https://financialmodelingprep.com/image-stock/${ticker}.png`;
}

