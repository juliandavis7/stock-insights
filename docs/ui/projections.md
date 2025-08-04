# Projections Page Implementation Guide for Claude Code

## Page Overview
Create a financial projections page that allows users to input growth assumptions and calculate projected financial metrics for a stock. Model the UI after the existing Search page, but extend it to handle multi-year projections with user inputs.

**Page Access**: This page should be accessible when clicking the "Projections" tab on the navbar and being routed to `/projections`.

## Design Requirements

### UI Model
- **Use existing Search page as template** - copy the same layout structure and styling
- **Extend for projections functionality** instead of just metrics display
- **Reuse existing components and styling** from the Search page where possible
- **Maintain consistent look and feel** with the rest of the application

### Layout Structure
```
Header (same as Search page)
├── Stock Selection Section (similar to Search)
│   └── Single stock input field with search functionality
├── Current Stock Info Section (auto-populated)
│   └── Stock price, market cap, shares outstanding display
├── Combined Financial Data Table
│   ├── Base year (2025) data + Projection years (2026-2029)
│   └── Shows both historical and projected metrics side-by-side
├── Projections Input Section
│   ├── Multi-year input form (2026-2029)
│   └── Run Projections button
└── Results populate in the Combined Financial Data Table
```

## Component Structure

### 1. Stock Selection Component
**ID**: `id="projections-stock-selection-container"`

**Features**:
- Single input field for stock ticker
- Auto-complete/validation for valid tickers
- Automatically populate base data upon valid ticker entry

**Layout**:
```jsx
<div id="projections-stock-selection-container">
  <input id="projections-stock-input" placeholder="Enter ticker (e.g., CELH)" />
</div>
```

### 2. Current Stock Info Display
**ID**: `id="projections-current-info-display"`

**Auto-populated fields**:
- Stock Price
- Market Cap
- Shares Outstanding

**Layout**:
```jsx
<div id="projections-current-info-display">
  <div id="stock-price-info">
    <span id="stock-price-value">$32.39</span>
    <span id="market-cap-value">MKT.CAP 8.49B</span>
    <span id="shares-outstanding-value">SHARES OUTSTANDING: 231,787,480</span>
  </div>
</div>
```

### 3. Combined Financial Data Table
**ID**: `id="projections-financial-data-table"`

**Table structure showing base year (2025) + projection years (2026-2029)**:
- Base year 2025 data (auto-populated from API)
- Projection years 2026-2029 (calculated after user input)

**Layout**:
```jsx
<div id="projections-financial-data-table">
  <div id="financial-data-year-headers">
    <div id="financial-metric-column">Metric</div>
    <div id="year-2025-column">2025</div>
    <div id="year-2026-column">2026</div>
    <div id="year-2027-column">2027</div>
    <div id="year-2028-column">2028</div>
    <div id="year-2029-column">2029</div>
  </div>
  
  <div id="financial-data-rows">
    <div id="revenue-data-row">
      <label>Revenue</label>
      <div id="revenue-2025">[Auto-populated]</div>
      <div id="revenue-2026">[Calculated]</div>
      <div id="revenue-2027">[Calculated]</div>
      <div id="revenue-2028">[Calculated]</div>
      <div id="revenue-2029">[Calculated]</div>
    </div>
    
    <div id="net-income-data-row">
      <label>Net Income</label>
      <div id="net-income-2025">[Auto-populated]</div>
      <div id="net-income-2026">[Calculated]</div>
      <div id="net-income-2027">[Calculated]</div>
      <div id="net-income-2028">[Calculated]</div>
      <div id="net-income-2029">[Calculated]</div>
    </div>
    
    <div id="net-income-margin-data-row">
      <label>Net Income Margins</label>
      <div id="net-income-margin-2025">[Auto-populated]</div>
      <div id="net-income-margin-2026">[Calculated]</div>
      <div id="net-income-margin-2027">[Calculated]</div>
      <div id="net-income-margin-2028">[Calculated]</div>
      <div id="net-income-margin-2029">[Calculated]</div>
    </div>
    
    <div id="eps-data-row">
      <label>EPS</label>
      <div id="eps-2025">[Auto-populated]</div>
      <div id="eps-2026">[Calculated]</div>
      <div id="eps-2027">[Calculated]</div>
      <div id="eps-2028">[Calculated]</div>
      <div id="eps-2029">[Calculated]</div>
    </div>
    
    <div id="share-price-low-data-row">
      <label>Share Price Low</label>
      <div id="share-price-low-2025">[Current Price]</div>
      <div id="share-price-low-2026">[Calculated]</div>
      <div id="share-price-low-2027">[Calculated]</div>
      <div id="share-price-low-2028">[Calculated]</div>
      <div id="share-price-low-2029">[Calculated]</div>
    </div>
    
    <div id="share-price-high-data-row">
      <label>Share Price High</label>
      <div id="share-price-high-2025">[Current Price]</div>
      <div id="share-price-high-2026">[Calculated]</div>
      <div id="share-price-high-2027">[Calculated]</div>
      <div id="share-price-high-2028">[Calculated]</div>
      <div id="share-price-high-2029">[Calculated]</div>
    </div>
    
    <div id="cagr-low-data-row">
      <label>CAGR Low</label>
      <div id="cagr-low-2025">-</div>
      <div id="cagr-low-2026">[Calculated]</div>
      <div id="cagr-low-2027">[Calculated]</div>
      <div id="cagr-low-2028">[Calculated]</div>
      <div id="cagr-low-2029">[Calculated]</div>
    </div>
    
    <div id="cagr-high-data-row">
      <label>CAGR High</label>
      <div id="cagr-high-2025">-</div>
      <div id="cagr-high-2026">[Calculated]</div>
      <div id="cagr-high-2027">[Calculated]</div>
      <div id="cagr-high-2028">[Calculated]</div>
      <div id="cagr-high-2029">[Calculated]</div>
    </div>
  </div>
</div>
```

### 4. Projections Input Form
**ID**: `id="projections-input-form-container"`

**Input fields for each year (2026-2029)**:
- Revenue Growth % (user input)
- Net Income Growth % (user input)
- PE Low Estimate (user input)
- PE High Estimate (user input)

**Calculated fields for each year (2026-2029)**:
- Net Income Margin % (calculated: NetIncMargin[year] = (NetIncome[year] / Revenue[year]) * 100)

**Layout**:
```jsx
<div id="projections-input-form-container">
  <div id="projections-year-headers">
    <div id="metric-label-column">Metric</div>
    <div id="year-2026-column">2026</div>
    <div id="year-2027-column">2027</div>
    <div id="year-2028-column">2028</div>
    <div id="year-2029-column">2029</div>
  </div>
  
  <div id="projections-input-rows">
    <div id="revenue-growth-input-row">
      <label>Revenue Growth %</label>
      <input id="revenue-growth-2026" type="number" placeholder="15" />
      <input id="revenue-growth-2027" type="number" placeholder="15" />
      <input id="revenue-growth-2028" type="number" placeholder="15" />
      <input id="revenue-growth-2029" type="number" placeholder="15" />
    </div>
    
    <div id="net-income-growth-input-row">
      <label>Net Income Growth %</label>
      <input id="net-income-growth-2026" type="number" placeholder="25" />
      <input id="net-income-growth-2027" type="number" placeholder="25" />
      <input id="net-income-growth-2028" type="number" placeholder="25" />
      <input id="net-income-growth-2029" type="number" placeholder="25" />
    </div>
    
    <div id="net-income-margin-input-row">
      <label>Net Income Margin %</label>
      <input id="net-income-margin-2026" type="number" placeholder="16" />
      <input id="net-income-margin-2027" type="number" placeholder="18" />
      <input id="net-income-margin-2028" type="number" placeholder="19" />
      <input id="net-income-margin-2029" type="number" placeholder="21" />
    </div>
    
    <div id="pe-low-input-row">
      <label>PE Low Estimate</label>
      <input id="pe-low-2026" type="number" placeholder="25" />
      <input id="pe-low-2027" type="number" placeholder="25" />
      <input id="pe-low-2028" type="number" placeholder="25" />
      <input id="pe-low-2029" type="number" placeholder="25" />
    </div>
    
    <div id="pe-high-input-row">
      <label>PE High Estimate</label>
      <input id="pe-high-2026" type="number" placeholder="35" />
      <input id="pe-high-2027" type="number" placeholder="35" />
      <input id="pe-high-2028" type="number" placeholder="35" />
      <input id="pe-high-2029" type="number" placeholder="35" />
    </div>
  </div>
  
  <button id="run-projections-button">Run Projections</button>
</div>
```

### 5. Projections Results Display
**ID**: `id="projections-results-display"`

**Note**: Results will populate directly in the Combined Financial Data Table above, in the 2026-2029 columns. No separate results section needed.

## Functionality Requirements

### Data Flow
1. **User Input**: Enter stock ticker
2. **Auto-populate**: Fetch current stock info and base year (2025) financial data
3. **User Projections**: Enter growth assumptions for 2026-2029
4. **Calculate**: Run projections using existing API endpoint
5. **Display**: Show calculated projections in results table

### API Integration
**Endpoints**:
- Use existing `/api/v1/metrics?ticker={symbol}` for base data
- Use existing `POST /api/v1/projections?ticker={symbol}` for calculations

**API Calls**:
1. **Initial data fetch**: Get current stock info and 2025 base metrics
2. **Projections calculation**: Send user inputs to projections API
3. **Error handling**: Handle invalid tickers and calculation errors

### Input Validation
- **Ticker validation**: Ensure valid stock symbol
- **Numeric validation**: Ensure all projection inputs are valid numbers
- **Range validation**: Reasonable ranges for growth rates and PE ratios
- **Required fields**: All projection inputs must be filled

### Auto-population Logic
**Upon valid ticker entry**:
1. Fetch stock price, market cap, shares outstanding
2. Fetch current year (2025) revenue, net income, EPS, margins
3. Pre-populate 2025 column in the Combined Financial Data Table
4. Enable projections input form

**Upon "Run Projections" button click**:
1. Validate all user inputs for 2026-2029
2. Send data to projections API
3. Populate calculated results in 2026-2029 columns of the Combined Financial Data Table

## Implementation Steps

### Step 1: Copy Search Page Structure
1. Use the existing Search page as a starting template
2. Modify for single stock input with auto-population
3. Add projections input form section
4. Add results display section

### Step 2: Base Data Integration
1. Connect to existing metrics API for initial stock data
2. Auto-populate current stock info upon ticker entry
3. Display base year (2025) financial metrics in the Combined Financial Data Table
4. Add loading states during data fetching

### Step 3: Projections Input Form
1. Create multi-year input grid (2026-2029)
2. Add input validation for all fields
3. Implement "Run Projections" functionality
4. Connect to existing projections API endpoint

### Step 4: Results Integration
1. Populate calculated projections directly in the Combined Financial Data Table (2026-2029 columns)
2. Format numbers appropriately (currency, percentages)
3. Add visual highlighting for projected vs base year data
4. Include export/save functionality

## Component File Structure
```
src/pages/ProjectionsPage.tsx
src/components/projections/
├── StockInfoDisplay.tsx
├── ProjectionsInputForm.tsx
├── ProjectionsResults.tsx
├── MetricInputRow.tsx
└── ProjectionsActions.tsx
```

## API Data Requirements
**Initial data fetch**:
- Stock price, market cap, shares outstanding from yfinance
- Current year financial metrics from FMP/metrics API

**Projections calculation**:
- User input data (growth rates, PE ratios)
- Base year financial data
- Calculated projections returned from API

## Success Criteria
- Users can input a stock ticker and see auto-populated base data
- Multi-year projections input form works correctly
- Projections calculations integrate with existing API
- Results display shows all calculated metrics properly formatted
- Page maintains consistent styling with Search page
- Loading states and error handling work properly
- Form validation prevents invalid inputs
- Responsive design works on all devices

## Future Enhancements
- Save/load projection scenarios
- Compare multiple projection scenarios
- Export projections to Excel/PDF
- Sensitivity analysis tools
- Monte Carlo simulations
- Historical accuracy tracking