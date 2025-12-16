/**
 * Portfolio Geography Breakdown Chart
 * 
 * Groups holdings by country and displays as a donut chart with flags
 */

import { PieChartBreakdown, PIE_CHART_COLORS } from './PieChartBreakdown';
import type { PortfolioResponse } from './PieChart';

interface PieChartProps {
  title?: string;
  data: PortfolioResponse;
}

// Map country codes to country names
const getCountryName = (countryCode: string | null): string => {
  if (!countryCode) return 'Unknown';
  const countryMap: { [key: string]: string } = {
    'us': 'United States',
    'ca': 'Canada',
    'gb': 'United Kingdom',
    'au': 'Australia',
    'de': 'Germany',
    'fr': 'France',
    'jp': 'Japan',
    'cn': 'China',
    'in': 'India',
    'br': 'Brazil',
    'mx': 'Mexico',
    'nl': 'Netherlands',
    'ch': 'Switzerland',
    'se': 'Sweden',
    'sg': 'Singapore',
    'hk': 'Hong Kong',
    'kr': 'South Korea',
    'tw': 'Taiwan',
    'it': 'Italy',
    'es': 'Spain',
  };
  return countryMap[countryCode.toLowerCase()] || countryCode.toUpperCase();
};

export function PieChartGeography({ title = "Geography Breakdown", data }: PieChartProps) {
  const countryMap = new Map<string, { marketValue: number; percent: number }>();
  
  data.holdings.forEach(holding => {
    if (holding.percent_of_portfolio !== null && holding.percent_of_portfolio > 0) {
      const countryCode = holding.country_code || 'unknown';
      const marketValue = holding.market_value || 0;
      const percent = holding.percent_of_portfolio;
      
      if (countryMap.has(countryCode)) {
        const existing = countryMap.get(countryCode)!;
        countryMap.set(countryCode, {
          marketValue: existing.marketValue + marketValue,
          percent: existing.percent + percent,
        });
      } else {
        countryMap.set(countryCode, { marketValue, percent });
      }
    }
  });

  const chartData = Array.from(countryMap.entries())
    .map(([countryCode, data], index) => ({
      country_code: countryCode,
      country_name: getCountryName(countryCode),
      value: data.percent,
      market_value: data.marketValue,
      color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <PieChartBreakdown
      title={title}
      chartData={chartData}
      labelKey="country_name"
      filterIdPrefix="geo"
      showFlag={true}
      tooltipLabelKey="country_name"
    />
  );
}
