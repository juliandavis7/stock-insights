/**
 * Portfolio Industry Breakdown Chart
 * 
 * Groups holdings by industry and displays as a donut chart
 */

import { PieChartBreakdown, PIE_CHART_COLORS } from './PieChartBreakdown';
import type { PortfolioResponse } from './PieChart';

interface PieChartProps {
  title?: string;
  data: PortfolioResponse;
}

export function PieChartIndustry({ title = "Industry Breakdown", data }: PieChartProps) {
  const industryMap = new Map<string, { marketValue: number; percent: number }>();
  
  data.holdings.forEach(holding => {
    if (holding.percent_of_portfolio !== null && holding.percent_of_portfolio > 0) {
      const industry = holding.industry || 'Unknown';
      const marketValue = holding.market_value || 0;
      const percent = holding.percent_of_portfolio;
      
      if (industryMap.has(industry)) {
        const existing = industryMap.get(industry)!;
        industryMap.set(industry, {
          marketValue: existing.marketValue + marketValue,
          percent: existing.percent + percent,
        });
      } else {
        industryMap.set(industry, { marketValue, percent });
      }
    }
  });

  const chartData = Array.from(industryMap.entries())
    .map(([industry, data], index) => ({
      industry,
      value: data.percent,
      market_value: data.marketValue,
      color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <PieChartBreakdown
      title={title}
      chartData={chartData}
      labelKey="industry"
      filterIdPrefix="industry"
      tooltipLabelKey="industry"
    />
  );
}
