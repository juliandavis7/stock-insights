/**
 * Portfolio Holdings Donut Chart
 * 
 * Displays individual stock holdings with logos
 */

import { 
  PieChartBase, 
  PIE_CHART_COLORS, 
  formatPercentOwnership,
  formatCurrencyCompact,
} from './PieChart';
import type { PortfolioResponse } from './PieChart';
import { LOGO_CONFIG, getLogoUrl } from "~/components/logos/StockLogo";

interface PieChartProps {
  title?: string;
  data: PortfolioResponse;
}

export function PieChartRecharts({ title = "Portfolio Holdings", data }: PieChartProps) {
  const chartData = data.holdings
    .filter(h => h.percent_of_portfolio !== null && h.percent_of_portfolio > 0)
    .map((h, index) => ({
      ...h,
      value: h.percent_of_portfolio!,
      market_value: h.market_value || 0,
      color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
    }));

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, ticker }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const isRightSide = x > cx;
    
    const logoSize = 20;
    const imageSize = 15;
    const containerWidth = 120;
    const containerHeight = 24;
    
    const foreignX = isRightSide ? x : x - containerWidth;
    const foreignY = y - containerHeight / 2;

    return (
      <foreignObject
        x={foreignX}
        y={foreignY}
        width={containerWidth}
        height={containerHeight}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '100%',
            justifyContent: isRightSide ? 'flex-start' : 'flex-end',
          }}
        >
          <div
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: '0.5rem',
              backgroundColor: LOGO_CONFIG.backgroundColor,
              ...(LOGO_CONFIG.borderColor && LOGO_CONFIG.borderWidth > 0 ? {
                border: `${LOGO_CONFIG.borderWidth}px solid ${LOGO_CONFIG.borderColor}`,
              } : {}),
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={getLogoUrl(ticker)}
              alt={ticker}
              style={{
                width: imageSize,
                height: imageSize,
                objectFit: LOGO_CONFIG.objectFit,
                filter: LOGO_CONFIG.imageFilter,
              }}
              referrerPolicy={LOGO_CONFIG.referrerPolicy}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap' }}>
            {ticker}{' '}
            <span style={{ fontWeight: 400, color: '#6b7280' }}>
              {formatPercentOwnership(percent * 100)}
            </span>
          </span>
        </div>
      </foreignObject>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const holding = payload[0].payload as typeof chartData[0];
      const percent = holding.percent_of_portfolio || 0;
      const marketValue = holding.market_value || 0;
      const sliceColor = holding.color;
      return (
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-gray-900 text-sm font-medium flex items-center gap-2">
            <span 
              className="inline-block w-2 h-2 rounded-full" 
              style={{ backgroundColor: sliceColor }}
            />
            {holding.ticker}: {formatCurrencyCompact(marketValue)} ({formatPercentOwnership(percent)})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <PieChartBase
      title={title}
      chartData={chartData}
      filterIdPrefix="holdings"
      customLabel={CustomLabel}
      customLabelLine={true}
      customTooltip={CustomTooltip}
    />
  );
}
