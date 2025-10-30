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
    description: 'Access the metrics that matter - built for investors, by investors.',
    features: [
      '10+ key financial indicators: P/E ratios, margins, growth rates, and more',
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
    description: 'Quickly see how stocks stack up side-by-side.',
    features: [
      'Compare up to 3 stocks across key financial indicators',
      'Industry benchmarking with contextual ranges'
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
    description: 'Create custom 5-year projections with your assumptions.',
    features: [
      'Input revenue growth, net income growth, and PE ratios to project stock price and CAGR',
      'Build bear, base, and bull case scenarios'
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
    description: 'Understand the company\'s financial trajectory at a glance.',
    features: [
      'Year-over-year growth rates for every metric',
      'Combine historical data with analyst estimates for deeper insights',
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
    description: 'Recognize trends visually.',
    features: [
      'View revenue, margin %, EPS, free cash flow, operating cash flow, and operating income charts',
      'Toggle between quarterly and TTM'
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