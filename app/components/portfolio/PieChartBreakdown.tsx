/**
 * Breakdown Pie Chart Component
 * 
 * Used for Sector, Industry, and Geography breakdown charts
 * Supports text wrapping for long labels and hiding small slices
 */

import { 
  PieChartBase, 
  PIE_CHART_COLORS,
  formatPercentOwnership,
  createDefaultTooltip,
  createCustomLabelLine,
} from './PieChart';
import type { ChartDataEntry } from './PieChart';
import { LOGO_CONFIG } from "~/components/logos/StockLogo";

interface PieChartBreakdownProps {
  title: string;
  chartData: ChartDataEntry[];
  labelKey: string;
  filterIdPrefix: string;
  showFlag?: boolean;
  tooltipLabelKey: string;
}

export { PIE_CHART_COLORS };

export function PieChartBreakdown({
  title,
  chartData,
  labelKey,
  filterIdPrefix,
  showFlag = false,
  tooltipLabelKey,
}: PieChartBreakdownProps) {
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, ...props }: any) => {
    // Hide label if percentage is less than 2%
    if (percent * 100 < 2) {
      return null;
    }

    const labelText = props[labelKey] || 'Unknown';
    const countryCode = props.country_code;
    
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const isRightSide = x > cx;
    
    const containerWidth = showFlag ? 160 : 180;
    const maxCharsPerLine = 12;
    const needsWrap = labelText.length > maxCharsPerLine;
    const containerHeight = needsWrap ? 48 : 36;
    
    const foreignX = isRightSide ? x : x - containerWidth;
    const foreignY = y - containerHeight / 2;

    const splitText = (text: string) => {
      if (text.length <= maxCharsPerLine) return { line1: text, line2: null };
      const words = text.split(' ');
      let line1 = '';
      let line2 = '';
      for (const word of words) {
        if (line1.length + word.length + 1 <= maxCharsPerLine || line1 === '') {
          line1 = line1 ? `${line1} ${word}` : word;
        } else {
          line2 = line2 ? `${line2} ${word}` : word;
        }
      }
      return { line1, line2 };
    };

    const { line1, line2 } = splitText(labelText);

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
            alignItems: showFlag ? 'center' : 'stretch',
            gap: '6px',
            height: '100%',
            justifyContent: isRightSide ? 'flex-start' : 'flex-end',
          }}
        >
          {showFlag && countryCode && countryCode !== 'unknown' && (
            <img
              src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`}
              alt={labelText}
              style={{
                width: 20,
                height: 14,
                objectFit: 'cover',
                flexShrink: 0,
                borderRadius: '2px',
              }}
              referrerPolicy={LOGO_CONFIG.referrerPolicy}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap' }}>
              {line1}
            </span>
            {needsWrap && line2 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap' }}>
                {line2}
              </span>
            )}
            <span style={{ fontSize: 10, fontWeight: 400, color: '#6b7280', textAlign: 'center' }}>
              {formatPercentOwnership(percent * 100)}
            </span>
          </div>
        </div>
      </foreignObject>
    );
  };

  return (
    <PieChartBase
      title={title}
      chartData={chartData}
      filterIdPrefix={filterIdPrefix}
      customLabel={CustomLabel}
      customLabelLine={createCustomLabelLine(2)}
      customTooltip={createDefaultTooltip(tooltipLabelKey)}
    />
  );
}
