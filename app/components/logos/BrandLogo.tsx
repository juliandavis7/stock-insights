import React from 'react';
import { BRAND_COLOR } from '~/config/brand';

interface BrandLogoProps {
  size?: string | number; // Height in px or rem (e.g., '70px', '3.5rem', 70)
  scale?: number; // Scale factor for cropping padding (default: 1.5)
  margin?: string; // CSS margin (e.g., '0px -8px 0px 0px' for top right bottom left)
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = '70px', 
  scale = 1.5,
  margin = '0px 0px 0px 0px',
  className = ''
}) => {
  // Convert size to string if it's a number
  const heightSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg 
      version="1.0" 
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 300"
      preserveAspectRatio="xMidYMid meet"
      className={`inline-block ${className}`}
      style={{
        height: heightSize,
        width: 'auto',
        transform: `scale(${scale})`,
        margin,
        shapeRendering: 'crispEdges',
        imageRendering: '-webkit-optimize-contrast',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}
    >
      <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)" fill={BRAND_COLOR} stroke="none">
        <path d="M1024 2004 c-15 -22 -16 -29 -5 -47 13 -20 293 -380 316 -405 10 -11
26 4 84 72 l72 86 -124 158 -123 157 -102 3 c-100 3 -101 2 -118 -24z m281
-140 c50 -63 96 -124 103 -134 12 -17 10 -24 -23 -65 l-37 -45 -41 53 c-23 28
-85 107 -139 175 -54 68 -98 125 -98 127 0 3 33 5 73 5 l72 -1 90 -115z"/>
        <path d="M1925 2019 c-33 -4 -112 -11 -175 -15 l-114 -7 49 -43 49 -44 -30
-32 c-17 -18 -136 -161 -265 -318 -473 -575 -439 -528 -414 -566 15 -23 21
-24 111 -24 93 0 97 1 122 29 15 15 162 193 327 394 l300 366 43 -42 c35 -34
42 -38 43 -22 0 11 6 89 12 173 7 85 10 155 7 156 -3 1 -32 -1 -65 -5z m9
-131 c-4 -46 -8 -85 -10 -87 -2 -2 -11 6 -21 18 -18 21 -20 19 -280 -296 -144
-175 -295 -359 -335 -410 l-73 -92 -72 0 c-40 -1 -73 1 -73 4 0 2 40 53 89
112 587 709 641 777 626 793 -8 9 -15 19 -15 23 0 3 30 8 68 10 37 2 75 4 85
5 16 2 17 -5 11 -80z"/>
        <path d="M1607 1334 c-80 -99 -87 -70 55 -244 l93 -115 93 -3 c177 -5 176 13
-14 256 -80 103 -149 188 -153 189 -3 1 -37 -37 -74 -83z m86 -6 c4 -10 116
-154 229 -295 8 -10 -6 -13 -64 -13 l-74 0 -90 113 -90 112 35 47 c38 50 46
55 54 36z"/>
      </g>
    </svg>
  );
};

export default BrandLogo;

