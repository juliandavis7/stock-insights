/**
 * Portfolio Sector Breakdown Chart
 * 
 * Groups holdings by sector and displays as a donut chart
 */

import { PieChartBreakdown, PIE_CHART_COLORS } from './PieChartBreakdown';
import type { PortfolioResponse } from './PieChart';

interface PieChartProps {
  title?: string;
  data: PortfolioResponse;
}

export function PieChartSector({ title = "Sector Breakdown", data }: PieChartProps) {
  const sectorMap = new Map<string, { marketValue: number; percent: number }>();
  
  data.holdings.forEach(holding => {
    if (holding.percent_of_portfolio !== null && holding.percent_of_portfolio > 0) {
      const sector = holding.sector || 'Unknown';
      const marketValue = holding.market_value || 0;
      const percent = holding.percent_of_portfolio;
      
      if (sectorMap.has(sector)) {
        const existing = sectorMap.get(sector)!;
        sectorMap.set(sector, {
          marketValue: existing.marketValue + marketValue,
          percent: existing.percent + percent,
        });
      } else {
        sectorMap.set(sector, { marketValue, percent });
      }
    }
  });

  const chartData = Array.from(sectorMap.entries())
    .map(([sector, data], index) => ({
      sector,
      value: data.percent,
      market_value: data.marketValue,
      color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <PieChartBreakdown
      title={title}
      chartData={chartData}
      labelKey="sector"
      filterIdPrefix="sector"
      tooltipLabelKey="sector"
    />
  );
}
