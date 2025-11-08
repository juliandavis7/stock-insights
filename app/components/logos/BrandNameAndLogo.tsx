import React from 'react';
import { BRAND_NAME, BRAND_COLOR } from '~/config/brand';

interface BrandNameAndLogoProps {
  size?: 'hero' | 'large' | 'medium' | 'small'; // Preset sizes
  className?: string;
  marginRight?: string; // Custom margin-right spacing (e.g., '0', '16px', '1rem')
  marginLeft?: string; // Custom margin-left spacing (e.g., '0', '16px', '1rem')
}

const BrandNameAndLogo: React.FC<BrandNameAndLogoProps> = ({ 
  size = 'medium',
  className = '',
  marginRight,
  marginLeft
}) => {
  // Size configurations
  const sizeConfig = {
    hero: {
      fontSize: '56px',
      fontWeight: 700,
      lineHeight: 1.1
    },
    large: {
      fontSize: '48px',
      fontWeight: 700,
      lineHeight: 1.1
    },
    medium: {
      fontSize: '30px',
      fontWeight: 700,
      lineHeight: 1.2
    },
    small: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: 1.2
    }
  };

  const config = sizeConfig[size];

  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ 
        fontSize: config.fontSize,
        lineHeight: config.lineHeight,
        fontWeight: config.fontWeight,
        color: BRAND_COLOR,
        ...(marginRight && { marginRight }),
        ...(marginLeft && { marginLeft })
      }}
    >
      <span>{BRAND_NAME}</span>
    </div>
  );
};

export default BrandNameAndLogo;

