export interface FeatureModule {
  id: string;
  header: string;
  headline: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  image: {
    src: string;
    alt: string;
  };
  imagePosition: 'left' | 'right';
}

export const featureModules: FeatureModule[] = [
  {
    id: 'search',
    header: 'Search',
    headline: 'Search',
    description: 'Access the most relevant financial metrics for long-term investors. Real-time data and peer comparisons at your fingertips.',
    features: [
      '15+ key metrics: P/E ratios, margins, growth rates, and more',
      'Industry benchmarking with contextual ranges'
    ],
    ctaText: 'Explore Search',
    ctaLink: '/search',
    image: {
      src: '/images/features/search.png',
      alt: 'Stock search interface showing financial metrics for analysis'
    },
    imagePosition: 'right'
  },
  {
    id: 'compare',
    header: 'Compare',
    headline: 'Compare',
    description: 'Instant side-by-side comparisons with color-coded columns to easily differentiate between stocks.',
    features: [
      'Compare 2-5 stocks simultaneously with identical metrics',
      'Save comparison sessions for future reference'
    ],
    ctaText: 'Start Comparing',
    ctaLink: '/compare',
    image: {
      src: '/images/features/compare.png',
      alt: 'Stock comparison table showing multiple stocks with performance metrics'
    },
    imagePosition: 'left'
  },
  {
    id: 'projections',
    header: 'Projections',
    headline: 'Projections',
    description: 'Create custom 5-year projections with your assumptions. Test different scenarios with instant calculations.',
    features: [
      'Bear, base, and bull case scenario modeling',
      'Compare your projections with analyst estimates'
    ],
    ctaText: 'Build Projections',
    ctaLink: '/projections',
    image: {
      src: '/images/features/projections.png',
      alt: 'Financial projections calculator showing scenario modeling interface'
    },
    imagePosition: 'right'
  },
  {
    id: 'financials',
    header: 'Financials',
    headline: 'Financials',
    description: 'View 2 years of historical performance plus 2 years of analyst estimates for comprehensive financial metrics.',
    features: [
      'Year-over-year growth rates for every metric',
      'Historical data combined with analyst estimates'
    ],
    ctaText: 'View Financials',
    ctaLink: '/financials',
    image: {
      src: '/images/features/financials.png',
      alt: 'Historical financials table showing performance data and estimates'
    },
    imagePosition: 'left'
  },
  {
    id: 'charts',
    header: 'Charts',
    headline: 'Charts',
    description: 'Interactive charts showing 2 years of historical data plus 2 years of analyst estimates. Hover for details, toggle views for precision.',
    features: [
      'Historical and projected data with clear visual distinction',
      'Interactive tooltips and toggle between quarterly/TTM views'
    ],
    ctaText: 'Explore Charts',
    ctaLink: '/charts',
    image: {
      src: '/images/features/charts.png',
      alt: 'Interactive charts showing historical and projected financial trends'
    },
    imagePosition: 'right'
  }
];