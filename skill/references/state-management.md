# State Management Reference

Complete guide to Zustand state management patterns and store structure.

## Overview

State management uses **Zustand 5.0** with DevTools middleware for debugging. The store provides centralized state for stock data, user inputs, and API caching.

**File**: `app/store/stockStore.ts`

## Store Structure

### Global State Slices

```tsx
interface StockStore {
  globalTicker: GlobalTickerState;
  stockInfo: StockInfoState;
  search: SearchState;
  compare: CompareState;
  projections: ProjectionsState;
  financials: FinancialsState;
  charts: ChartsState;
  cache: CacheState;
  actions: Actions;
}
```

## State Slices

### 1. Global Ticker

**Purpose**: Track currently selected stock symbol across all pages.

```tsx
globalTicker: {
  currentTicker: string | null;   // "AAPL", "MSFT", etc.
  isLoading: boolean;
}
```

**Usage**:
```tsx
import { useGlobalTicker, useStockActions } from "~/store/stockStore";

function MyComponent() {
  const globalTicker = useGlobalTicker();
  const actions = useStockActions();
  
  // Read current ticker
  console.log(globalTicker.currentTicker); // "AAPL"
  
  // Update ticker
  actions.setGlobalTicker("MSFT");
  
  // Clear ticker
  actions.clearGlobalTicker();
}
```

**Actions**:
- `setGlobalTicker(ticker: string | null)` - Set current ticker
- `setGlobalLoading(loading: boolean)` - Set loading state
- `clearGlobalTicker()` - Reset to null

---

### 2. Stock Info

**Purpose**: Current stock price, market cap, shares outstanding.

```tsx
stockInfo: {
  data: StockInfo | null;
  loading: boolean;
  error: string | null;
  lastFetchTicker: string | null;
  cacheExpiry: number | null;
}

interface StockInfo {
  ticker: string;
  price: number;
  market_cap: number;
  shares_outstanding: number;
}
```

**Usage**:
```tsx
import { useStockInfo, useStockActions } from "~/store/stockStore";

function StockHeader() {
  const stockInfo = useStockInfo();
  const actions = useStockActions();
  
  // Display data
  if (stockInfo.loading) return <p>Loading...</p>;
  if (stockInfo.error) return <p>Error: {stockInfo.error}</p>;
  
  return (
    <div>
      <p>{stockInfo.data?.ticker}</p>
      <p>Price: ${stockInfo.data?.price}</p>
      <p>Market Cap: ${stockInfo.data?.market_cap}</p>
    </div>
  );
}
```

**Actions**:
- `fetchStockInfo(ticker, authenticatedFetch)` - Fetch from API
- `setStockInfoData(data)` - Set data
- `setStockInfoLoading(loading)` - Set loading state
- `setStockInfoError(error)` - Set error message
- `clearStockInfo()` - Reset state

---

### 3. Search (Metrics)

**Purpose**: Stock metrics for search page (PE ratios, growth rates, margins).

```tsx
search: {
  data: FinancialMetrics | null;
  loading: boolean;
  error: string | null;
}

interface FinancialMetrics {
  ticker: string | null;
  ttm_pe: number | null;
  forward_pe: number | null;
  two_year_forward_pe: number | null;
  ttm_eps_growth: number | null;
  current_year_eps_growth: number | null;
  next_year_eps_growth: number | null;
  ttm_revenue_growth: number | null;
  current_year_revenue_growth: number | null;
  next_year_revenue_growth: number | null;
  gross_margin: number | null;
  net_margin: number | null;
  ttm_ps_ratio: number | null;
  forward_ps_ratio: number | null;
}
```

**Usage**:
```tsx
import { useSearchState, useStockActions } from "~/store/stockStore";

function SearchPage() {
  const searchState = useSearchState();
  const actions = useStockActions();
  
  const handleSearch = async (ticker: string) => {
    actions.setSearchLoading(true);
    try {
      const data = await actions.fetchMetrics(ticker, authenticatedFetch);
      actions.setSearchData(data);
    } catch (error) {
      actions.setSearchError(error.message);
    } finally {
      actions.setSearchLoading(false);
    }
  };
  
  return <div>{/* Display metrics */}</div>;
}
```

**Actions**:
- `fetchMetrics(ticker, authenticatedFetch)` - Fetch from API
- `setSearchData(data)` - Set data
- `setSearchLoading(loading)` - Set loading state
- `setSearchError(error)` - Set error message

---

### 4. Compare

**Purpose**: Multi-stock comparison (up to 3 stocks).

```tsx
compare: {
  tickers: [string, string, string];
  data: {
    [ticker: string]: FinancialMetrics | null;
  };
  loading: { [index: number]: boolean };
  errors: { [index: number]: string | null };
}
```

**Default**: `['AAPL', 'MSFT', 'GOOGL']`

**Usage**:
```tsx
import { useCompareState, useStockActions } from "~/store/stockStore";

function ComparePage() {
  const compareState = useCompareState();
  const actions = useStockActions();
  
  // Update a ticker
  actions.setCompareTicker(0, "TSLA"); // Change first ticker
  
  // Fetch data for a ticker
  const fetchTicker = async (index: number, ticker: string) => {
    actions.setCompareLoading(index, true);
    try {
      const data = await actions.fetchMetrics(ticker, authenticatedFetch);
      actions.setCompareData(ticker, data);
    } catch (error) {
      actions.setCompareError(index, error.message);
    } finally {
      actions.setCompareLoading(index, false);
    }
  };
  
  return (
    <div>
      {compareState.tickers.map((ticker, i) => (
        <div key={i}>
          {ticker}: {compareState.data[ticker]?.ttm_pe}
        </div>
      ))}
    </div>
  );
}
```

**Actions**:
- `setCompareTicker(index, ticker)` - Update ticker at index
- `setCompareData(ticker, data)` - Set data for ticker
- `setCompareLoading(index, loading)` - Set loading for index
- `setCompareError(index, error)` - Set error for index

---

### 5. Projections

**Purpose**: Stock price projection calculator with scenarios.

```tsx
projections: {
  baseData: ProjectionBaseData | null;
  projectionInputs: ProjectionInputs;
  calculatedProjections: CalculatedProjections;
  loading: boolean;
  error: string | null;
}

interface ProjectionBaseData {
  ticker: string;
  revenue: number | null;
  net_income: number | null;
  eps: number | null;
  net_income_margin: number | null;
  data_year: number;
}

interface ProjectionInputs {
  revenueGrowth: { [year: string]: number };
  netIncomeGrowth: { [year: string]: number };
  peLow: { [year: string]: number };
  peHigh: { [year: string]: number };
}

interface CalculatedProjections {
  revenue: { [year: string]: number };
  netIncome: { [year: string]: number };
  netIncomeMargin: { [year: string]: number };
  eps: { [year: string]: number };
  sharePriceLow: { [year: string]: number };
  sharePriceHigh: { [year: string]: number };
  cagrLow: { [year: string]: number };
  cagrHigh: { [year: string]: number };
}
```

**Usage**:
```tsx
import { useProjectionsState, useStockActions } from "~/store/stockStore";

function ProjectionsPage() {
  const projectionsState = useProjectionsState();
  const actions = useStockActions();
  
  // Fetch base data
  await actions.fetchProjections("AAPL", authenticatedFetch);
  
  // Update inputs
  actions.setProjectionsInputs({
    revenueGrowth: { "2025": 10, "2026": 12 },
    netIncomeGrowth: { "2025": 15, "2026": 18 },
    peLow: { "2025": 20, "2026": 22 },
    peHigh: { "2025": 25, "2026": 28 }
  });
  
  // Set calculated results
  actions.setCalculatedProjections({
    revenue: { "2025": 420000000000 },
    // ... other calculations
  });
}
```

**Actions**:
- `fetchProjections(ticker, authenticatedFetch)` - Fetch base data
- `setProjectionsBaseData(data)` - Set base data
- `setProjectionsInputs(inputs)` - Update user inputs
- `setCalculatedProjections(projections)` - Set calculated results
- `setProjectionsLoading(loading)` - Set loading state
- `setProjectionsError(error)` - Set error message

**Scenario Cache**:
Projections support three scenarios (base, bull, bear) with caching:

```tsx
// Get cached scenario data
const scenarioData = actions.getCachedScenarioProjections("AAPL");
console.log(scenarioData?.base.projectionInputs);
console.log(scenarioData?.bull.calculatedProjections);

// Set scenario data
actions.setCachedScenarioProjections("AAPL", {
  base: { projectionInputs, calculatedProjections },
  bull: { projectionInputs, calculatedProjections },
  bear: { projectionInputs, calculatedProjections },
  activeScenario: 'base'
});

// Clear scenario cache
actions.clearScenarioProjectionsCache("AAPL"); // Clear for specific ticker
actions.clearScenarioProjectionsCache(); // Clear all
```

---

### 6. Financials

**Purpose**: Historical and estimated financial statements.

```tsx
financials: {
  data: FinancialsData | null;
  loading: boolean;
  error: string | null;
}

interface FinancialsData {
  ticker: string;
  historical: HistoricalData[];
  estimates: EstimateData[];
}

interface HistoricalData {
  fiscalYear: string;
  totalRevenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  eps: number | null;
  dilutedEps: number | null;
  // ... more fields
}

interface EstimateData {
  fiscalYear: string;
  totalRevenue: number | null;
  netIncome: number | null;
  eps: number | null;
  dilutedEps: number | null;
}
```

**Usage**:
```tsx
import { useFinancialsState, useStockActions } from "~/store/stockStore";

function FinancialsPage() {
  const financialsState = useFinancialsState();
  const actions = useStockActions();
  
  // Fetch data
  await actions.fetchFinancials("AAPL", authenticatedFetch);
  
  // Display historical data
  return (
    <div>
      {financialsState.data?.historical.map(year => (
        <div key={year.fiscalYear}>
          {year.fiscalYear}: ${year.totalRevenue}
        </div>
      ))}
    </div>
  );
}
```

**Actions**:
- `fetchFinancials(ticker, authenticatedFetch)` - Fetch from API
- `setFinancialsData(data)` - Set data
- `setFinancialsLoading(loading)` - Set loading state
- `setFinancialsError(error)` - Set error message

---

### 7. Charts

**Purpose**: Chart data (revenue, EPS, margins, cash flows).

```tsx
charts: {
  data: ChartData | null;
  loading: boolean;
  error: string | null;
  viewMode: "quarterly" | "ttm";
}

interface ChartData {
  ticker: string;
  quarters: string[];
  revenue: number[];
  eps: number[];
  gross_margin: (number | null)[];
  net_margin: (number | null)[];
  operating_income: (number | null)[];
  operating_cash_flow: (number | null)[];
  free_cash_flow: (number | null)[];
}
```

**Usage**:
```tsx
import { useChartsState, useStockActions } from "~/store/stockStore";

function ChartsPage() {
  const chartsState = useChartsState();
  const actions = useStockActions();
  
  // Fetch quarterly data
  await actions.fetchCharts("AAPL", "quarterly", authenticatedFetch);
  
  // Switch to TTM mode
  actions.setChartsViewMode("ttm");
  await actions.fetchCharts("AAPL", "ttm", authenticatedFetch);
  
  // Use data in chart components
  return <RevenueChart data={chartsState.data} />;
}
```

**Actions**:
- `fetchCharts(ticker, mode, authenticatedFetch)` - Fetch from API
- `setChartsData(data)` - Set data
- `setChartsLoading(loading)` - Set loading state
- `setChartsError(error)` - Set error message
- `setChartsViewMode(mode)` - Set "quarterly" or "ttm"

---

### 8. Cache

**Purpose**: Client-side caching to reduce API calls.

```tsx
cache: {
  stockInfo: { [ticker: string]: { data: StockInfo; timestamp: number } };
  metrics: { [ticker: string]: FinancialMetrics };
  projections: { [ticker: string]: ProjectionBaseData };
  scenarioProjections: { [ticker: string]: ScenarioData };
  financials: { [ticker: string]: FinancialsData };
  charts: { [ticker: string]: ChartData };
}
```

**Cache Actions**:
- `getCachedStockInfo(ticker)` - Get cached stock info
- `getCachedMetrics(ticker)` - Get cached metrics
- `getCachedProjections(ticker)` - Get cached projections
- `getCachedScenarioProjections(ticker)` - Get cached scenarios
- `getCachedFinancials(ticker)` - Get cached financials
- `getCachedCharts(ticker)` - Get cached charts
- `setCachedScenarioProjections(ticker, data)` - Set scenario cache
- `clearScenarioProjectionsCache(ticker?)` - Clear scenario cache

**Cache Flow**:
1. Action called (e.g., `fetchMetrics`)
2. Check cache for ticker
3. If found, return cached data
4. If not found, fetch from API
5. Store in cache
6. Return data

## Zustand Store Setup

**File**: `app/store/stockStore.ts`

```tsx
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useStockStore = create<StockStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      globalTicker: {
        currentTicker: getInitialTicker(),
        isLoading: false,
      },
      
      search: {
        data: null,
        loading: false,
        error: null,
      },
      
      // ... other state slices
      
      cache: {
        stockInfo: {},
        metrics: {},
        projections: {},
        scenarioProjections: {},
        financials: {},
        charts: {},
      },
      
      // Actions
      actions: {
        setGlobalTicker: (ticker) => {
          set((state) => ({
            globalTicker: { ...state.globalTicker, currentTicker: ticker }
          }), false, 'setGlobalTicker');
          
          // Persist to localStorage
          if (typeof window !== 'undefined' && ticker) {
            localStorage.setItem('globalTicker', ticker);
          }
        },
        
        fetchMetrics: async (ticker, authenticatedFetch) => {
          const { cache } = get();
          
          // Check cache
          const cached = cache.metrics[ticker];
          if (cached) {
            console.log(`Using cached metrics for ${ticker}`);
            return cached;
          }
          
          // Fetch from API
          const apiUrl = import.meta.env.VITE_API_BASE_URL;
          const fetchFn = authenticatedFetch || fetch;
          const response = await fetchFn(`${apiUrl}/metrics?ticker=${ticker}`);
          
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Cache the data
          set((state) => ({
            cache: {
              ...state.cache,
              metrics: { ...state.cache.metrics, [ticker]: data }
            }
          }), false, 'cacheMetrics');
          
          return data;
        },
        
        // ... other actions
      },
    }),
    { name: 'stock-store' } // DevTools name
  )
);

// Export individual selectors for better performance
export const useGlobalTicker = () => useStockStore((state) => state.globalTicker);
export const useStockInfo = () => useStockStore((state) => state.stockInfo);
export const useSearchState = () => useStockStore((state) => state.search);
export const useCompareState = () => useStockStore((state) => state.compare);
export const useProjectionsState = () => useStockStore((state) => state.projections);
export const useFinancialsState = () => useStockStore((state) => state.financials);
export const useChartsState = () => useStockStore((state) => state.charts);
export const useStockActions = () => useStockStore((state) => state.actions);
```

## Usage Patterns

### Basic State Access

```tsx
import { useSearchState } from "~/store/stockStore";

function MyComponent() {
  const searchState = useSearchState();
  
  return <div>{searchState.data?.ticker}</div>;
}
```

### Calling Actions

```tsx
import { useStockActions } from "~/store/stockStore";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";

function MyComponent() {
  const actions = useStockActions();
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  const handleFetch = async () => {
    await actions.fetchMetrics("AAPL", authenticatedFetch);
  };
  
  return <button onClick={handleFetch}>Fetch</button>;
}
```

### Concurrent Requests

```tsx
const loadAllData = async (ticker: string) => {
  actions.setGlobalTicker(ticker);
  
  const [chartsResult, stockInfoResult, metricsResult] = await Promise.allSettled([
    actions.fetchCharts(ticker, 'quarterly', authenticatedFetch),
    actions.fetchStockInfo(ticker, authenticatedFetch),
    actions.fetchMetrics(ticker, authenticatedFetch)
  ]);
  
  if (chartsResult.status === 'fulfilled') {
    actions.setChartsData(chartsResult.value);
  }
  // Handle other results
};
```

### Local State + Global State

```tsx
function MyComponent() {
  const [localTicker, setLocalTicker] = useState("");
  const actions = useStockActions();
  
  const handleSearch = () => {
    // Update global state
    actions.setGlobalTicker(localTicker);
    // Fetch data
    actions.fetchMetrics(localTicker, authenticatedFetch);
  };
  
  return (
    <div>
      <input value={localTicker} onChange={e => setLocalTicker(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
}
```

## Best Practices

1. **Use selectors** - Import specific hooks (`useSearchState`) instead of full store
2. **Batch updates** - Use `set()` once per action to avoid multiple re-renders
3. **Normalize data** - Store by ticker key for easy lookup
4. **Cache aggressively** - Reduce API calls with client-side cache
5. **Handle errors** - Always set error state in catch blocks
6. **Update global ticker** - Keep `globalTicker` in sync across pages
7. **Use TypeScript** - Leverage interfaces for type safety
8. **DevTools** - Use Redux DevTools extension to debug state changes
9. **Clear state** - Reset state when switching tickers if needed
10. **Concurrent fetching** - Use `Promise.allSettled` for parallel requests

## DevTools

Zustand integrates with Redux DevTools browser extension:

- View state snapshots
- Track action history
- Time-travel debugging
- Action names visible (e.g., "setGlobalTicker", "cacheMetrics")

Install: [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)

