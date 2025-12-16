# Portfolio Holdings Pie Chart Components

This directory contains 5 different implementations of a professional portfolio holdings donut chart, each using a different React charting library.

## Available Implementations

### 1. PieChartRecharts
**Library:** Recharts  
**Package:** `npm install recharts`  
**Best for:** Simple, lightweight, good default styling  
**Pros:** Easy to use, good TypeScript support, responsive by default  
**Cons:** Limited customization compared to others

### 2. PieChartChartJS
**Library:** Chart.js with react-chartjs-2  
**Package:** `npm install chart.js react-chartjs-2 chartjs-plugin-datalabels`  
**Best for:** Professional charts with extensive customization  
**Pros:** Very customizable, great performance, large community  
**Cons:** Requires additional plugin for external labels

### 3. PieChartNivo
**Library:** Nivo (@nivo/pie)  
**Package:** `npm install @nivo/pie`  
**Best for:** Beautiful, animated charts with built-in features  
**Pros:** Beautiful defaults, smooth animations, built-in leader lines  
**Cons:** Larger bundle size, less flexible than Chart.js

### 4. PieChartApex
**Library:** ApexCharts  
**Package:** `npm install react-apexcharts apexcharts`  
**Best for:** Interactive, feature-rich charts  
**Pros:** Very interactive, great tooltips, many features  
**Cons:** Larger bundle size, requires client-side rendering

### 5. PieChartPlotly
**Library:** Plotly.js  
**Package:** `npm install react-plotly.js plotly.js`  
**Best for:** Scientific/analytical charts with advanced features  
**Pros:** Very powerful, scientific-grade features  
**Cons:** Largest bundle size, overkill for simple charts

## Usage

```tsx
import { PieChartRecharts } from '~/components/portfolio';
// or
import { PieChartChartJS } from '~/components/portfolio';
// etc.

function PortfolioPage({ portfolioData }: { portfolioData: PortfolioResponse }) {
  return (
    <div>
      <PieChartRecharts data={portfolioData} />
    </div>
  );
}
```

## Features

All implementations include:
- ✅ Donut chart style (40% inner radius)
- ✅ Dark slate background (#1e293b)
- ✅ External labels with ticker + percentage
- ✅ Leader lines connecting slices to labels
- ✅ Custom color palette (15 colors)
- ✅ Hover tooltips with:
  - Ticker and full company name
  - Market value (formatted currency)
  - Gain/Loss % (color-coded)
  - Number of shares
- ✅ Center display showing total portfolio value
- ✅ Smooth animations
- ✅ Responsive design

## Data Structure

All components expect a `PortfolioResponse` object:

```typescript
interface PortfolioResponse {
  holdings: Holding[];
  total_market_value: number;
  total_cost_basis: number;
  total_gain_loss_pct: number;
  detected_format: string;
  excluded_items: Array<{ reason: string; ticker: string }>;
}

interface Holding {
  name: string;
  shares: number;
  ticker: string;
  cost_basis: number;
  market_value: number;
  gain_loss_pct: number;
  current_price: number;
  pe_ratio: number | null;
  percent_of_portfolio: number; // Used for pie chart
}
```

## Recommendations

- **For most use cases:** Use `PieChartRecharts` - simple, lightweight, good defaults
- **For maximum customization:** Use `PieChartChartJS` - most flexible
- **For best visual appeal:** Use `PieChartNivo` - beautiful animations
- **For interactive features:** Use `PieChartApex` - best tooltips and interactions
- **For scientific/analytical needs:** Use `PieChartPlotly` - most powerful

## Bundle Size Considerations

Approximate bundle sizes (gzipped):
- Recharts: ~50KB
- Chart.js: ~60KB
- Nivo: ~80KB
- ApexCharts: ~100KB
- Plotly: ~300KB

Choose based on your bundle size constraints and feature needs.

