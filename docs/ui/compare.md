# Compare Page Implementation Guide for Claude Code

## Page Overview
Create a stock comparison page that allows users to compare 3 stocks side-by-side with key financial metrics. Model the UI after the existing Search page, but extend it to handle 3 tickers simultaneously instead of just 1.

## Design Requirements

### UI Model
- **Use existing Search page as template** - copy the same layout structure and styling
- **Extend for 3 stocks** instead of 1 stock
- **Reuse existing components and styling** from the Search page where possible
- **Maintain consistent look and feel** with the rest of the application

### Layout Structure
```
Header (same as Search page)
├── Stock Selection Section (extended from Search)
│   ├── Three stock input fields instead of one
│   └── Compare button (similar to Search button)
├── Results Section (extended from Search)
│   ├── Side-by-side metrics display for 3 stocks
│   └── Comparison table format
└── Advanced Metrics Section (optional)
```

## Component Structure

### 1. Stock Selection Component
**ID**: `id="compare-stock-selection-container"`

**Features**:
- Three input fields for stock tickers
- Auto-complete/validation for valid tickers
- "Compare" button to trigger analysis
- Add/remove stock functionality
- Clear all button

**Layout**:
```jsx
<div id="compare-stock-selection-container">
  <div id="compare-stock-inputs-row">
    <input id="compare-stock-input-1" placeholder="Enter ticker (e.g., AAPL)" />
    <input id="compare-stock-input-2" placeholder="Enter ticker (e.g., MSFT)" />
    <input id="compare-stock-input-3" placeholder="Enter ticker (e.g., GOOGL)" />
  </div>
  <button id="compare-stocks-submit-button">Compare</button>
</div>
```

### 2. Metrics Comparison Table
**ID**: `id="compare-metrics-results-table"`

**Metrics to Display**:
- **Gross Margin** 
- **Net Margin**
- **TTM P/S Ratio**
- **Forward P/S Ratio**
- **TTM PE**
- **Forward PE** 
- **2 Year Forward PE**
- **TTM EPS Growth**
- **Current Year EPS Growth**
- **Next Year EPS Growth**
- **TTM Revenue Growth**
- **Current Year Revenue Growth**
- **Next Year Revenue Growth**

**Table Structure**:
```jsx
<div id="compare-metrics-results-table">
  <div id="compare-table-header">
    <div id="metric-name-column">Metric</div>
    <div id="stock-1-column">STOCK1</div>
    <div id="stock-2-column">STOCK2</div>
    <div id="stock-3-column">STOCK3</div>
    <div id="benchmark-column">Benchmark Range</div>
  </div>
  
  <div id="compare-table-rows">
    {/* Metric rows */}
  </div>
</div>
```

### 3. Advanced Metrics Section
**ID**: `id="compare-advanced-metrics-section"`

**Additional Metrics**:
- Last Year EPS Growth
- TTM vs NTM EPS Growth
- Current Quarter EPS Growth vs Prev Year
- 2 Year Stock Expected EPS Growth

## Styling Requirements

### Color Coding for Performance
- **Best performer highlighting**: Automatically highlight the best value in each metric row
- **Percentage formatting**: Show growth rates with % symbol  
- **Ratio formatting**: Display P/E and P/S ratios with proper decimal places
- **Benchmark context**: Show "Many stocks trade at X-Y%" ranges (same as Search page)

## Functionality Requirements

### Data Flow
1. **User Input**: Enter 3 stock tickers
2. **Validation**: Check if tickers are valid
3. **API Calls**: Fetch metrics for all 3 stocks simultaneously
4. **Data Processing**: Calculate comparison highlights
5. **Display**: Render comparison table with color coding

### API Integration
**Endpoint**: Use existing `/api/v1/metrics?ticker={symbol}` endpoint
**Calls**: Make 3 simultaneous calls for the 3 selected stocks
**Error Handling**: Handle invalid tickers gracefully

### Interactive Features
- **Hover effects** on table rows
- **Sortable columns** (optional)
- **Export functionality** (CSV/PDF)
- **Save comparison** for later reference
- **Clear/reset** comparison

## Implementation Steps

### Step 1: Copy Search Page Structure
1. Use the existing Search page as a starting template
2. Modify the stock input section to accept 3 tickers instead of 1
3. Adapt the results section to display 3 columns of data
4. Keep the same styling classes and component structure

### Step 2: Extend Functionality
1. Connect to existing metrics API for 3 stocks simultaneously
2. Implement form validation for 3 ticker inputs
3. Add loading states during API calls (reuse from Search page)
4. Process and display comparison data in table format

### Step 3: Comparison Features
1. Add logic to highlight best/worst performers in each metric
2. Maintain the same metric formatting as Search page
3. Include benchmark ranges for context
4. Add basic comparison interactions

### Step 4: Polish and Testing
1. Ensure responsive design works with 3-column layout
2. Test with various stock combinations
3. Verify all functionality works consistently with Search page
4. Add any missing error handling

## Component File Structure
```
src/pages/ComparePage.tsx
src/components/compare/
├── StockSelectionForm.tsx
├── ComparisonTable.tsx
├── MetricRow.tsx
├── AdvancedMetrics.tsx
└── CompareActions.tsx
```

## API Data Requirements
For each stock, fetch:
- All metrics from existing `/metrics` endpoint
- Format and normalize data for comparison
- Calculate relative performance indicators

## Success Criteria
- Users can input 3 stock tickers using similar interface to Search page
- Metrics are displayed in clean comparison format
- Visual highlighting shows best/worst performers  
- Page maintains consistent styling with Search page
- Loading states and error handling work properly (same as Search page)
- Responsive design works on all devices
- All functionality integrates seamlessly with existing application

## Future Enhancements
- Support for comparing 4-5 stocks
- Historical comparison data
- Chart overlays for visual comparison
- Peer group comparisons
- Custom metric selection