import React from 'react';
import { BrandLogo } from './index';
import { BRAND_NAME_TEXT, BRAND_COLOR } from '~/config/brand';

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
      logoSize: '100px',
      logoScale: 1.3,
      logoMargin: '0px 8px 4px -25px',
      fontWeight: 700,
      lineHeight: 1.1
    },
    large: {
      fontSize: '48px',
      logoSize: '85px',
      logoScale: 1.3,
      logoMargin: '0px 8px 4px -20px',
      fontWeight: 700,
      lineHeight: 1.1
    },
    medium: {
      fontSize: '30px',
      logoSize: '55px',
      logoScale: 1.3,
      logoMargin: '0px 4px 2px -15px',
      fontWeight: 700,
      lineHeight: 1.2
    },
    small: {
      fontSize: '24px',
      logoSize: '45px',
      logoScale: 1.3,
      logoMargin: '0px 4px 2px -12px',
      fontWeight: 600,
      lineHeight: 1.2
    }
  };

  const config = sizeConfig[size];

  return (
    <div 
      className={`flex items-center justify-center gap-0 ${className}`}
      style={{ 
        fontSize: config.fontSize,
        lineHeight: config.lineHeight,
        fontWeight: config.fontWeight,
        color: BRAND_COLOR,
        ...(marginRight && { marginRight }),
        ...(marginLeft && { marginLeft })
      }}
    >
      <span>{BRAND_NAME_TEXT}</span>
      <BrandLogo 
        size={config.logoSize} 
        scale={config.logoScale} 
        margin={config.logoMargin} 
      />
    </div>
  );
};

export default BrandNameAndLogo;

