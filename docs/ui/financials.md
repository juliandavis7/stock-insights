# Financials Page Implementation Guide for Claude Code

## Page Overview
Create a financial statements page that displays comprehensive income statement data and forward-looking estimates for a single stock. Users enter a ticker symbol and receive detailed financial metrics in a structured table format showing historical data (2021-2024) and projections (2025-2027).

## Design Requirements

### UI Model
- **Use existing Search page as template** - copy the same layout structure and styling
- **Single ticker input** similar to Search page
- **Extended results section** with comprehensive financial table
- **Maintain consistent look and feel** with the rest of the application

### Layout Structure
```
Header (same as Search page)
├── Stock Selection Section (similar to Search)
│   ├── Single stock input field
│   └── Get Financials button
├── Stock Info Header
│   ├── Company ticker display
│   ├── Current stock price (optional)
│   └── Market cap (optional)
└── Financial Metrics Table
    ├── Revenue & Profitability Section
    ├── Operating Expenses Section  
    └── Earnings Per Share Section
```

## Component Structure

### 1. Stock Selection Component
**ID**: `id="financials-stock-selection-container"`

**Features**:
- Single input field for stock ticker
- Auto-complete/validation for valid tickers
- "Get Financials" button to trigger data fetch
- Clear/reset functionality

**Layout**:
```jsx
<div id="financials-stock-selection-container">
  <div id="financials-stock-input-row">
    <input id="financials-stock-input" placeholder="Enter ticker (e.g., PYPL)" />
    <button id="financials-submit-button">Get Financials</button>
  </div>
</div>
```

### 2. Stock Info Header
**ID**: `id="financials-stock-info-header"`

**Display Elements**:
- **Ticker Symbol**: Large, prominent display
- **Stock Price**: Current price with currency (if available)
- **Market Cap**: Formatted market capitalization (if available)

**Layout**:
```jsx
<div id="financials-stock-info-header">
  <h1 id="financials-ticker-display">{ticker}</h1>
  <div id="financials-stock-metrics">
    <span id="stock-price">STOCK PRICE: ${price}</span>
    <span id="market-cap">MKT.CAP: {marketCap}</span>
  </div>
</div>
```

### 3. Financial Metrics Table
**ID**: `id="financials-metrics-table"`

**Table Structure**:
```jsx
<div id="financials-metrics-table">
  <div id="financials-table-header">
    <div id="metric-column">METRIC</div>
    <div id="year-2021">2021</div>
    <div id="year-2022">2022</div>
    <div id="year-2023">2023</div>
    <div id="year-2024">2024</div>
    <div id="year-2025">2025</div>
    <div id="year-2026">2026</div>
    <div id="year-2027">2027</div>
  </div>
  
  <div id="financials-table-sections">
    {/* Revenue Section */}
    {/* OPEX Section */}
    {/* EPS Section */}
  </div>
</div>
```

## Financial Metrics to Display

### Revenue & Profitability Section
- **TOTAL REVENUE**
  - Historical data (2021-2024) from `historical[].totalRevenue`
  - Projections (2025-2027) from `estimates[].totalRevenue`
  - Year-over-year growth percentages
- **COST OF REVENUE**
  - Historical data from `historical[].costOfRevenue`
  - Growth percentages
  - Note: Not available in estimates
- **GROSS PROFIT**
  - Historical data from `historical[].grossProfit`
  - Growth percentages
  - Note: Not available in estimates

### Operating Expenses (OPEX) Section
- **SG&A** (Sales, General & Administrative)
  - Historical data from `historical[].sellingGeneralAndAdministrative`
  - Growth percentages
  - Note: Not available in estimates
- **R&D** (Research & Development)
  - Historical data from `historical[].researchAndDevelopment`
  - Growth percentages
  - Note: Not available in estimates
- **TOTAL OPEX**
  - Historical data from `historical[].operatingExpenses`
  - Growth percentages
  - Note: Not available in estimates
- **OPERATING INCOME**
  - Historical data from `historical[].operatingIncome`
  - Growth percentages (including negative growth)
  - Note: Not available in estimates

### Net Income & EPS Section
- **NET INCOME**
  - Historical data from `historical[].netIncome`
  - Projected data from `estimates[].netIncome`
  - Growth percentages
- **BASIC EPS** (Earnings Per Share)
  - Historical data from `historical[].eps`
  - Projected data from `estimates[].eps`
  - Growth percentages
- **DILUTED EPS**
  - Historical data from `historical[].dilutedEps`
  - Projected data from `estimates[].dilutedEps`
  - Growth percentages

## API Integration

### Endpoint Configuration
- **API URL**: `{{host}}/financials?ticker={{ticker}}`
- **Method**: GET
- **Parameters**: 
  - `ticker`: Stock symbol (e.g., "PYPL")

### Expected Response Structure
```json
{
  "ticker": "PYPL",
  "historical": [
    {
      "fiscalYear": "2024",
      "totalRevenue": 31797000000,
      "costOfRevenue": 17139000000,
      "grossProfit": 14658000000,
      "sellingGeneralAndAdministrative": 4148000000,
      "researchAndDevelopment": 2979000000,
      "operatingExpenses": 8895000000,
      "operatingIncome": 5763000000,
      "netIncome": 4147000000,
      "eps": 4.03,
      "dilutedEps": 3.99
    }
    // ... more historical years
  ],
  "estimates": [
    {
      "fiscalYear": "2025",
      "totalRevenue": 34340760000,
      "netIncome": 4478760000,
      "eps": 4.35,
      "dilutedEps": 4.31
    }
    // ... more estimate years
  ]
}
```

### Data Processing Logic
1. **Combine Data**: Merge `historical` and `estimates` arrays into single timeline
2. **Sort by Year**: Ensure chronological order (2021-2027)
3. **Handle Missing Data**: Some metrics only available in historical data
4. **Calculate Growth**: Compute year-over-year percentage changes
5. **Format Numbers**: Convert large numbers to billions/millions with appropriate suffixes

## Data Formatting Requirements

### Number Formatting
- **Large Numbers**: Convert raw values to readable format
  - `31797000000` → `$31.80B` (billions)
  - `4147000000` → `$4.15B` (billions) 
  - `2979000000` → `$2.98B` (billions)
- **EPS Values**: Show as currency with 2 decimal places
  - `4.03` → `$4.03`
  - `3.99` → `$3.99`
- **Currency Symbol**: Use $ for all monetary values

### Growth Percentage Calculation & Display
```javascript
// Example growth calculation
const calculateGrowth = (current, previous) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

// Example: PYPL 2024 vs 2023 revenue growth
// (31797000000 - 29771000000) / 29771000000 * 100 = 6.8%
```

- **Positive Growth**: Display with % symbol (e.g., `6.8%`)
- **Negative Growth**: Display with negative sign (e.g., `-2.4%`)
- **High Growth**: Handle exceptional cases (>100%)
- **Color Coding**: 
  - Green text for positive growth
  - Red text for negative growth
  - Neutral for stable/no data

### Special Value Handling
- **Missing Data**: Display as "N/A" for estimate-only metrics in historical years
- **Zero Values**: Display as "$0.00" 
- **Null/Undefined**: Show as "N/A"

## Styling Requirements

### Table Design
- **Header Row**: Bold, uppercase metric names and years
- **Data Columns**: Consistent width for year columns
- **Section Grouping**: Visual separation between Revenue, OPEX, and EPS sections
- **Alternating Rows**: Subtle background differences for readability
- **Responsive Design**: Horizontal scroll for mobile if needed

### Visual Hierarchy
- **Metric Names**: Left-aligned, bold text in dedicated column
- **Financial Data**: Right-aligned numerical data
- **Growth Percentages**: Smaller font, positioned below main value
- **Year Headers**: Center-aligned, bold

### Color Scheme
- **Positive Growth**: Green (#10B981 or similar)
- **Negative Growth**: Red (#EF4444 or similar)
- **Neutral Data**: Default text color
- **Missing Data**: Muted gray color

## Implementation Steps

### Step 1: API Integration
1. Create service function to call `{{host}}/financials?ticker={{ticker}}`
2. Handle HTTP errors and invalid ticker responses
3. Parse and validate response structure
4. Implement loading states

### Step 2: Data Processing
1. Merge historical and estimates arrays
2. Sort by fiscal year chronologically
3. Calculate year-over-year growth percentages
4. Format large numbers appropriately
5. Handle missing data gracefully

### Step 3: Component Development
1. Build input form component (reuse Search page pattern)
2. Create financial table component with proper structure
3. Implement metric row components with growth indicators
4. Add responsive design for different screen sizes

### Step 4: User Experience
1. Add loading spinners during API calls
2. Implement error messaging for invalid tickers
3. Add hover effects for better interactivity
4. Include export functionality (CSV/PDF)

## Component File Structure
```
src/pages/FinancialsPage.tsx
src/components/financials/
├── FinancialsInputForm.tsx
├── FinancialsTable.tsx
├── FinancialMetricRow.tsx
├── GrowthIndicator.tsx
├── FinancialsHeader.tsx
└── utils/
    ├── formatFinancialNumbers.ts
    ├── calculateGrowthRates.ts
    └── processFinancialData.ts
```

## Utility Functions Needed

### Number Formatting
```javascript
const formatLargeNumber = (value) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const formatEPS = (value) => {
  return `$${value.toFixed(2)}`;
};
```

### Growth Calculation
```javascript
const calculateYoYGrowth = (current, previous) => {
  if (!previous || previous === 0) return null;
  const growth = ((current - previous) / Math.abs(previous)) * 100;
  return `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
};
```

### Data Processing
```javascript
const processFinancialData = (apiResponse) => {
  const { historical, estimates, ticker } = apiResponse;
  
  // Combine and sort data
  const allYears = [...historical, ...estimates]
    .sort((a, b) => parseInt(a.fiscalYear) - parseInt(b.fiscalYear));
  
  // Calculate growth rates
  const processedData = allYears.map((yearData, index) => {
    const previousYear = allYears[index - 1];
    return {
      ...yearData,
      growthRates: {
        totalRevenue: calculateYoYGrowth(yearData.totalRevenue, previousYear?.totalRevenue),
        netIncome: calculateYoYGrowth(yearData.netIncome, previousYear?.netIncome),
        eps: calculateYoYGrowth(yearData.eps, previousYear?.eps),
        // ... other growth calculations
      }
    };
  });
  
  return { ticker, financialData: processedData };
};
```

## Success Criteria
- Users can input any valid stock ticker and receive comprehensive financial data
- Historical data (2021-2024) displays with all available metrics
- Estimate data (2025-2027) shows projected revenue, net income, and EPS
- Growth percentages calculate correctly and display with appropriate color coding
- Large numbers format consistently (billions/millions) 
- Missing data handled gracefully with "N/A" indicators
- Page design matches existing application styling
- Loading states and error handling work properly
- Table is responsive and readable on all device sizes

## Future Enhancements
- **Additional Metrics**: Include cash flow and balance sheet data
- **Quarterly View**: Toggle between annual and quarterly data
- **Historical Range**: Extend historical data beyond 4 years
- **Peer Comparison**: Compare financials with industry peers
- **Charts Integration**: Add visual representations of key trends
- **Export Features**: Download data as Excel/CSV
- **Guidance Tracking**: Show management guidance vs actual results
- **Analyst Coverage**: Display analyst estimates and ratings