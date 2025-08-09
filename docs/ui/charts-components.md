# Charts Page Implementation Guide for Claude Code

## Page Overview

Create a charts page that displays financial data for a single stock using interactive line charts. The page will initially feature charts for **revenue** and **net income**, with the ability to add more charts in the future. The design should be clean, focused, and responsive.

## Design Requirements

### UI Model

  - **Simple, focused layout**: Display one stock's charts at a time.
  - **Consistent look and feel**: Use existing application styling for headers, typography, and colors.
  - **Responsive design**: Charts should be viewable and interactive on both desktop and mobile devices.

### Layout Structure

```
Header (standard application header)
├── Stock Search/Input Section
│   └── Single input field for ticker
│   └── Chart generation button
├── Charts Section
│   ├── Revenue Chart Component
│   └── Net Income Chart Component
└── Footer (standard application footer)
```

\<hr\>

## Component Structure

### 1\. Stock Selection Component

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

### 2\. Revenue Chart Component

**ID**: `id="revenue-chart-container"`

**Features**:

  - Displays quarterly revenue data as a line chart.
  - **Title**: Clearly labeled "Quarterly Revenue."
  - **Axes**: The X-axis should show the `quarters` from the API, and the Y-axis should show the `revenue` values.
  - **Tooltips**: On hover, tooltips should display the specific quarter and corresponding revenue value.
  - **Styling**: The line should be a specific color, with markers at each data point.

**Layout**:

```jsx
<div id="revenue-chart-container">
  <h2>Quarterly Revenue</h2>
  <canvas id="revenue-chart"></canvas>
</div>
```

### 3\. Net Income Chart Component

**ID**: `id="net-income-chart-container"`

**Features**:

  - Displays quarterly net income (calculated from `eps` and `shares outstanding`, if available, or just using `eps` as a proxy if no shares data is available, with a note explaining the approximation) as a line chart.
  - **Title**: Clearly labeled "Quarterly Net Income."
  - **Axes**: The X-axis should show the `quarters` and the Y-axis should show the net income values.
  - **Tooltips**: Tooltips on hover to show the quarter and net income value.
  - **Styling**: Distinct line color from the revenue chart for easy differentiation.

**Layout**:

```jsx
<div id="net-income-chart-container">
  <h2>Quarterly Net Income</h2>
  <canvas id="net-income-chart"></canvas>
</div>
```

\<hr\>

## Styling Requirements

  - **Consistent Typography**: Use the same fonts and sizes as the rest of the application.
  - **Color Palette**: Use a consistent color scheme for chart lines, backgrounds, and text.
  - **Layout**: Use CSS Flexbox or Grid for a clean, aligned layout.
  - **Responsiveness**: Ensure charts scale appropriately for different screen sizes.

\<hr\>

## Functionality Requirements

### Data Flow

1.  **User Input**: A user enters a ticker in the input field.
2.  **API Call**: On clicking "Show Charts", the application makes a GET request to the `/charts` API endpoint with the selected ticker.
3.  **Data Processing**: The JSON response is parsed. The `quarters` and `revenue` arrays are used for the revenue chart, and `quarters` and `eps` arrays are used for the net income chart.
4.  **Display**: The chart components are updated with the fetched data, and the charts are rendered.

### API Integration

  - **Endpoint**: `{{host}}/charts?ticker={{ticker}}`
  - **Method**: `GET`
  - **Response**: The API returns an object containing `quarters`, `revenue`, and `eps` arrays.
  - **Error Handling**: Implement a robust error handling mechanism. If the API returns a 404 for an invalid ticker, display an error message to the user instead of a blank chart.

\<hr\>

## Implementation Steps

### Step 1: Create Page and Layout

1.  Create a new `ChartsPage.tsx` component.
2.  Implement the basic layout with a header, stock selection area, charts section, and footer.
3.  Use a state management solution (e.g., React's `useState`) to manage the current ticker and chart data.

### Step 2: Build Stock Selection Component

1.  Create the input field and button.
2.  Add an event handler for the button click that triggers the API call.
3.  Implement a loading state variable that changes to `true` on button click and `false` after the API response is received.

### Step 3: Implement Chart Components

1.  Choose a charting library (e.g., **Chart.js**, **D3.js**, **Recharts**) to handle chart rendering. **Chart.js** is a good choice for its simplicity and ease of use.
2.  Create `RevenueChart.tsx` and `NetIncomeChart.tsx` components.
3.  These components should accept `data` as a prop and use the charting library to render the line chart based on the provided data.
4.  Use the `useEffect` hook to re-render the charts whenever the data prop changes.

### Step 4: Connect Components and Logic

1.  In `ChartsPage.tsx`, call the API when the "Show Charts" button is clicked.
2.  Store the API response data in the component's state.
3.  Pass the relevant data arrays (`quarters` and `revenue`/`eps`) as props to the `RevenueChart` and `NetIncomeChart` components.

### Step 5: Polish and Testing

1.  Test the page with various stock tickers to ensure data is fetched and rendered correctly.
2.  Check for edge cases, such as tickers with no available data.
3.  Verify the responsive behavior and ensure the charts look good on mobile.
4.  Add clear error messages for invalid tickers or network issues.

\<hr\>

## Component File Structure

```
src/pages/ChartsPage.tsx
src/components/charts/
├── StockInput.tsx
├── RevenueChart.tsx
└── NetIncomeChart.tsx
```

\<hr\>

## API Data Requirements

The `/charts` API will provide all the necessary data in a single call.

  - **`quarters`**: An array of strings representing the time periods (e.g., "2023 Q1").
  - **`revenue`**: An array of numbers for the revenue corresponding to each quarter.
  - **`eps`**: An array of numbers for the earnings per share, which will be used to plot net income.

\<hr\>

## Success Criteria

  - Users can input a ticker and view two charts (revenue and net income).
  - The charts are clean, readable, and display the correct data from the API.
  - The page maintains a consistent look and feel with the rest of the application.
  - All loading and error states are handled gracefully and provide clear feedback to the user.
  - The page is responsive and works well on all screen sizes.

\<hr\>