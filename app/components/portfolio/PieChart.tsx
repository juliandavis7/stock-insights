/**
 * Base Pie Chart Component
 * 
 * Parent component for all portfolio pie charts
 * Contains shared rendering logic, styles, and utilities
 */

import React from "react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Shared color palette for all pie charts
export const PIE_CHART_COLORS = [
  '#3B82F6', '#F97316', '#A855F7', '#FACC15', '#06B6D4', 
  '#EC4899', '#22C55E', '#EF4444', '#8B5CF6', '#6366F1', 
  '#14B8A6', '#F59E0B', '#64748B', '#84CC16', '#0EA5E9'
];

// Shared formatting utilities
export const formatCurrencyCompact = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
};

export const formatPercentOwnership = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatCurrencyFull = (value: number): string => {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Shared interfaces
export interface Holding {
  name: string | null;
  ticker: string;
  exchange: string | null;
  country_code: string | null;
  industry: string | null;
  sector: string | null;
  shares: number;
  cost_basis: number;
  market_value: number | null;
  gain_loss_pct: number | null;
  current_price: number | null;
  pe_ratio: number | null;
  percent_of_portfolio: number | null;
}

export interface PortfolioResponse {
  holdings: Holding[];
  total_market_value: number;
  total_cost_basis: number;
  total_gain_loss_pct: number;
  detected_format: string;
  excluded_items: Array<{ reason: string; ticker: string }>;
}

export interface ChartDataEntry {
  value: number;
  market_value: number;
  color: string;
  [key: string]: any;
}

interface PieChartBaseProps {
  title: string;
  chartData: ChartDataEntry[];
  filterIdPrefix: string;
  customLabel: (props: any) => React.ReactElement | null;
  customLabelLine?: ((props: any) => React.ReactElement | null) | boolean;
  customTooltip: (props: any) => React.ReactElement | null;
}

export function PieChartBase({
  title,
  chartData,
  filterIdPrefix,
  customLabel,
  customLabelLine = true,
  customTooltip,
}: PieChartBaseProps) {
  // Don't render if no data
  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="overflow-visible">
      <h3 className="text-lg font-semibold text-gray-900 mb-0 text-center">{title}</h3>
      <div className="w-full overflow-visible" style={{ marginTop: '-50px' }}>
        <div className="relative" style={{ height: '560px', padding: '0px 30px 30px 30px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
              <defs>
                {chartData.map((entry, index) => (
                  <filter key={index} id={`${filterIdPrefix}-shadow-${index}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
                  </filter>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={customLabelLine as any}
                label={customLabel}
                outerRadius={140}
                innerRadius={60}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{ filter: `url(#${filterIdPrefix}-shadow-${index})` }}
                  />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Helper to create chart data with colors
export function createChartData<T extends { value: number; market_value: number }>(
  entries: Omit<T, 'color'>[]
): (T & { color: string })[] {
  return entries.map((entry, index) => ({
    ...entry,
    color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
  })) as (T & { color: string })[];
}

// Default tooltip component factory
export function createDefaultTooltip(labelKey: string) {
  return function DefaultTooltip({ active, payload }: any) {
    if (active && payload && payload[0]) {
      const entry = payload[0].payload as ChartDataEntry;
      const percent = entry.value || 0;
      const marketValue = entry.market_value || 0;
      const sliceColor = entry.color;
      const label = entry[labelKey] || 'Unknown';
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-gray-900 text-sm font-medium flex items-center gap-2">
            <span 
              className="inline-block w-2 h-2 rounded-full" 
              style={{ backgroundColor: sliceColor }}
            />
            {label}: {formatCurrencyCompact(marketValue)} ({formatPercentOwnership(percent)})
          </p>
        </div>
      );
    }
    return null;
  };
}

// Custom label line that hides for small slices (< 2%)
export function createCustomLabelLine(minPercent: number = 2) {
  return function CustomLabelLine(props: any) {
    const { cx, cy, midAngle, outerRadius, percent, stroke } = props;
    
    // Hide label line if percentage is less than threshold
    if (percent * 100 < minPercent) {
      return null;
    }
    
    // Draw the label line manually with the slice color
    const RADIAN = Math.PI / 180;
    const startX = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const startY = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    const endX = cx + (outerRadius + 30) * Math.cos(-midAngle * RADIAN);
    const endY = cy + (outerRadius + 30) * Math.sin(-midAngle * RADIAN);
    
    return (
      <path
        d={`M${startX},${startY}L${endX},${endY}`}
        stroke={stroke}
        fill="none"
      />
    );
  };
}

