# Charts Page Implementation Guide for Claude Code

## Page Overview

Create a charts page that displays financial data for a single stock using interactive charts. The page will feature multiple charts for comprehensive financial analysis. The design should be clean, focused, and responsive.

## Chart Implementation Status

- ✅ **Revenue Chart** - COMPLETE (bar chart)
- ❌ **Gross Margin & Net Margin Chart** - TODO (line chart, both margins on same chart)
- ✅ **EPS Chart** - COMPLETE (bar chart)
- ❌ **Operating Income Chart** - TODO (bar chart)

## Design Requirements

### UI Model

- **Simple, focused layout**: Display one stock's charts at a time.
- **Consistent look and feel**: Use existing application styling for headers, typography, and colors.
- **Responsive design**: Charts should be viewable and interactive on both desktop and mobile devices.

### Chart Display Order

Charts should be displayed in this specific order:

1. **Revenue Chart** (quarterly revenue data)
2. **Gross Margin & Net Margin Chart** (both margins on same line chart)
3. **EPS Chart** (earnings per share data)
4. **Operating Income Chart** (quarterly operating income data)

### Layout Structure

```
Header (standard application header)
├── Stock Search/Input Section
│   └── Single input field for ticker
│   └── Chart generation button
├── Charts Section
│   ├── Revenue Chart Component ✅
│   ├── Margin Chart Component (Gross + Net) ❌
│   ├── EPS Chart Component ✅
│   └── Operating Income Chart Component ❌
└── Footer (standard application footer)
```

## Component Structure

### 1. Stock Selection Component

**ID**: `id="charts-stock-selection-container"`

**Features**:

- A single input field for a stock ticker.
- **Auto-complete/validation**: The input should suggest valid tickers and validate user input.
- **"Show Charts" button**: Triggers the API call and chart rendering.
- **Loading state**: A spinner or text should indicate data is being fetched.
- **Error handling**: Display a clear message if the ticker is invalid or data cannot be fetched.

**Layout**:

```jsx
<div id="charts-stock-selection-container">
  <input 
    id="charts-stock-input" 
    type="text" 
    placeholder="Enter ticker (e.g., AAPL)" 
  />
  <button id="charts-show-button">Show Charts</button>
</div>
```

### 2. Revenue Chart Component ✅

**ID**: `id="revenue-chart-container"`

**Status**: COMPLETE

**Features**:

- Displays quarterly revenue data as a bar chart.
- **Title**: Clearly labeled "Quarterly Revenue."
- **Axes**: The X-axis shows quarters, Y-axis shows revenue values.
- **Tooltips**: On hover, tooltips display the specific quarter and corresponding revenue value.
- **Styling**: Uses golden amber color `#F59E0B` for bars.

### 3. Margin Chart Component ❌

**ID**: `id="margin-chart-container"`

**Status**: TODO

**Features**:

- Displays both gross margin and net margin data on the same line chart.
- **Title**: Clearly labeled "Gross Margin & Net Margin."
- **Axes**: The X-axis shows quarters, Y-axis shows margin percentages.
- **Lines**: 
  - **Gross Margin**: Magenta/pink color `#E879F9`
  - **Net Margin**: Cyan/turquoise color `#22D3EE`
- **Legend**: Clear legend identifying both lines.
- **Tooltips**: On hover, show quarter and both margin values.
- **Data**: Only display quarters with actual margin data (filter out nulls).

**Layout**:

```jsx
<div id="margin-chart-container">
  <h2>Gross Margin & Net Margin</h2>
  <canvas id="margin-chart"></canvas>
</div>
```

### 4. EPS Chart Component ✅

**ID**: `id="eps-chart-container"`

**Status**: COMPLETE

**Features**:

- Displays quarterly EPS data as a bar chart.
- **Title**: Clearly labeled "Earnings Per Share (EPS)."
- **Axes**: The X-axis shows quarters, Y-axis shows EPS values.
- **Tooltips**: On hover, tooltips display the specific quarter and corresponding EPS value.
- **Styling**: Consistent with revenue chart styling.

### 5. Operating Income Chart Component ❌

**ID**: `id="operating-income-chart-container"`

**Status**: TODO

**Features**:

- Displays quarterly operating income data as a bar chart.
- **Title**: Clearly labeled "Operating Income."
- **Axes**: The X-axis shows quarters, Y-axis shows operating income values.
- **Tooltips**: On hover, tooltips display the specific quarter and corresponding operating income value.
- **Styling**: Uses golden amber color `#F59E0B` for bars (same as revenue chart).
- **Data**: Only display quarters with actual operating income data (filter out nulls).
- **Formatting**: Display values in billions (e.g., "$1.53B").

**Layout**:

```jsx
<div id="operating-income-chart-container">
  <h2>Operating Income</h2>
  <canvas id="operating-income-chart"></canvas>
</div>
```

## Styling Requirements

- **Consistent Typography**: Use the same fonts and sizes as the rest of the application.
- **Color Palette**: 
  - Revenue & Operating Income bars: Golden amber `#F59E0B`
  - Gross Margin line: Magenta `#E879F9`
  - Net Margin line: Cyan `#22D3EE`
- **Layout**: Use CSS Flexbox or Grid for a clean, aligned layout.
- **Responsiveness**: Ensure charts scale appropriately for different screen sizes.

## Functionality Requirements

### Data Flow

1. **User Input**: A user enters a ticker in the input field.
2. **API Call**: On clicking "Show Charts", the application makes a GET request to the `/charts` API endpoint with the selected ticker.
3. **Data Processing**: The JSON response is parsed and distributed to all chart components.
4. **Display**: All chart components are updated with the fetched data, and the charts are rendered in the specified order.

### API Integration

- **Endpoint**: `{{host}}/charts?ticker={{ticker}}`
- **Method**: `GET`
- **Response**: The API returns an object containing `quarters`, `revenue`, `eps`, `gross_margin`, `net_margin`, and `operating_income` arrays.
- **Error Handling**: Implement robust error handling. If the API returns a 404 for an invalid ticker, display an error message to the user instead of blank charts.

## Implementation Steps

### Step 1: Create Page and Layout

1. Create a new `ChartsPage.tsx` component.
2. Implement the basic layout with a header, stock selection area, charts section (in specified order), and footer.
3. Use React's `useState` to manage the current ticker and chart data.

### Step 2: Build Stock Selection Component

1. Create the input field and button.
2. Add an event handler for the button click that triggers the API call.
3. Implement a loading state variable that changes to `true` on button click and `false` after the API response is received.

### Step 3: Implement Missing Chart Components

**For Margin Chart (TODO):**
1. Create `MarginChart.tsx` component using a line chart library.
2. Component should accept `data` as a prop and render both gross and net margin lines.
3. Use different colors for each line and include a legend.
4. Filter out null values before rendering.

**For Operating Income Chart (TODO):**
1. Create `OperatingIncomeChart.tsx` component using the same structure as revenue chart.
2. Follow existing bar chart patterns from revenue/EPS charts.
3. Format values appropriately (in billions).
4. Filter out null values before rendering.

### Step 4: Connect Components and Logic

1. In `ChartsPage.tsx`, call the API when the "Show Charts" button is clicked.
2. Store the API response data in the component's state.
3. Pass the relevant data arrays as props to all chart components.
4. Render charts in the specified order: Revenue → Margins → EPS → Operating Income.

### Step 5: Polish and Testing

1. Test the page with various stock tickers to ensure data is fetched and rendered correctly.
2. Check for edge cases, such as tickers with no available data.
3. Verify the responsive behavior and ensure all charts look good on mobile.
4. Add clear error messages for invalid tickers or network issues.
5. Ensure consistent styling across all charts.

## Component File Structure

```
src/pages/ChartsPage.tsx
src/components/charts/
├── StockInput.tsx
├── RevenueChart.tsx ✅
├── MarginChart.tsx ❌
├── EPSChart.tsx ✅
└── OperatingIncomeChart.tsx ❌
```

## API Data Requirements

The `/charts` API provides all necessary data in a single call:

- **`quarters`**: Array of strings representing time periods (e.g., "2023 Q1").
- **`revenue`**: Array of numbers for revenue corresponding to each quarter.
- **`eps`**: Array of numbers for earnings per share.
- **`gross_margin`**: Array of numbers for gross margin percentages (may contain nulls).
- **`net_margin`**: Array of numbers for net margin percentages (may contain nulls).
- **`operating_income`**: Array of numbers for operating income (may contain nulls).

## Success Criteria

- Users can input a ticker and view all four charts in the specified order.
- The charts are clean, readable, and display the correct data from the API.
- The page maintains a consistent look and feel with the rest of the application.
- All loading and error states are handled gracefully and provide clear feedback to the user.
- The page is responsive and works well on all screen sizes.
- Chart colors follow the specified color scheme for visual consistency.
- Null values are properly filtered out and don't break chart rendering.