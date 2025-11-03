import { BRAND_NAME } from './brand';

// Single subscription plan configuration
export const SUBSCRIPTION_PLAN = {
  name: BRAND_NAME,
  // This is your internal product UUID that maps to your Polar product
  polarProductId: import.meta.env.VITE_PRODUCT_ID || '',
  price: 10,
  interval: 'month',
  features: [
    'Search and analyze stocks with 10+ key financial metrics',
    'Compare up to 3 stocks side-by-side across all metrics',
    'Build custom 5-year financial projections with your own assumptions',
    'Model bear, base, and bull case scenarios to evaluate risk and upside',
    'Access complete historical financials alongside analyst estimates',
    'Interactive charts for revenue, margins, EPS, and cash flows',
    'Year-over-year growth calculations for every metric',
    'Toggle between quarterly and trailing twelve month (TTM) data',
    'Industry benchmarking with contextual performance ranges',
  ]
} as const;

// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

