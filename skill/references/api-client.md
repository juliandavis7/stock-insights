# API Client Reference

Complete guide to API integration patterns, authentication, and endpoint usage.

## Authentication Setup

### useAuthenticatedFetch Hook

**File**: `app/hooks/useAuthenticatedFetch.ts`

Wraps fetch requests with Clerk authentication tokens.

```tsx
import { useAuth } from "@clerk/react-router";
import { useCallback } from "react";

export function useAuthenticatedFetch() {
  const { getToken, isSignedIn, userId } = useAuth();
  
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (!isSignedIn) return null;
    
    try {
      const token = await getToken();
      // Only log token in local environment
      if (import.meta.env.VITE_ENV === 'local') {
        console.log(`Token: ${token}`);
      }
      return token;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  }, [getToken, isSignedIn, userId]);
  
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!isSignedIn) throw new Error("User not authenticated");
    
    const token = await getToken();
    if (!token) throw new Error("Failed to obtain authentication token");
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }, [getToken, isSignedIn]);
  
  return { 
    authenticatedFetch, 
    getAuthToken,
    isSignedIn,
    userId 
  };
}
```

**Usage in Components**:
```tsx
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";

function MyComponent() {
  const { authenticatedFetch, isSignedIn } = useAuthenticatedFetch();
  const actions = useStockActions();
  
  const fetchData = async (ticker: string) => {
    if (!isSignedIn) {
      // Redirect to sign in
      return;
    }
    
    // Use store action (recommended)
    await actions.fetchCharts(ticker, 'quarterly', authenticatedFetch);
    
    // Or direct fetch for custom endpoints
    const response = await authenticatedFetch(`${apiUrl}/custom`);
    const data = await response.json();
  };
}
```

## Base URL Configuration

**Environment Variable**: `VITE_API_BASE_URL`

```bash
# .env
VITE_API_BASE_URL=http://localhost:8000  # Local development
# OR
VITE_API_BASE_URL=https://api.production.com  # Production
```

**Usage**:
```tsx
const fastApiUrl = import.meta.env.VITE_API_BASE_URL;
const response = await authenticatedFetch(`${fastApiUrl}/metrics?ticker=AAPL`);
```

## Error Handling Patterns

### Standard Error Response
```json
{
  "detail": "Error message or object",
  "error": "Specific error description"
}
```

### Error Handling Code
```tsx
try {
  const response = await authenticatedFetch(url);
  
  if (!response.ok) {
    // Try to parse error details
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail?.error 
      || errorData.detail 
      || `API request failed: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error("API Error:", error);
  // Set error state
  actions.setChartsError(error instanceof Error ? error.message : "Unknown error");
}
```

### Rate Limiting (429 Errors)

FastAPI backend may return 429 status for rate limiting. Handle gracefully:

```tsx
if (!response.ok) {
  if (response.status === 429) {
    throw new Error("Rate limit exceeded. Please try again in a moment.");
  }
  // Handle other errors
}
```

## Zustand Store Actions

All API calls should preferably use Zustand store actions for automatic caching.

### fetchStockInfo
**Endpoint**: `GET /stock-info?ticker={symbol}`

```tsx
const actions = useStockActions();
const { authenticatedFetch } = useAuthenticatedFetch();

await actions.fetchStockInfo('AAPL', authenticatedFetch);

// Access data
const stockInfo = useStockInfo();
console.log(stockInfo.data); // { ticker, price, market_cap, shares_outstanding }
```

**Response Structure**:
```json
{
  "ticker": "AAPL",
  "price": 178.45,
  "market_cap": 2800000000000,
  "shares_outstanding": 15700000000
}
```

---

### fetchMetrics
**Endpoint**: `GET /metrics?ticker={symbol}`

```tsx
await actions.fetchMetrics('AAPL', authenticatedFetch);

// Access data
const searchState = useSearchState();
console.log(searchState.data);
```

**Response Structure**:
```json
{
  "ticker": "AAPL",
  "ttm_pe": 28.5,
  "forward_pe": 25.2,
  "two_year_forward_pe": 22.1,
  "ttm_eps_growth": 10.5,
  "current_year_eps_growth": 8.2,
  "next_year_eps_growth": 12.4,
  "ttm_revenue_growth": 5.8,
  "current_year_revenue_growth": 6.1,
  "next_year_revenue_growth": 7.3,
  "gross_margin": 45.2,
  "net_margin": 25.8,
  "ttm_ps_ratio": 7.2,
  "forward_ps_ratio": 6.5
}
```

**Usage Pattern**:
```tsx
const handleSearch = async (symbol: string) => {
  actions.setSearchLoading(true);
  actions.setSearchError(null);
  
  try {
    const data = await actions.fetchMetrics(symbol, authenticatedFetch);
    actions.setSearchData(data);
  } catch (error) {
    actions.setSearchError(error instanceof Error ? error.message : "Error");
  } finally {
    actions.setSearchLoading(false);
  }
};
```

---

### fetchCharts
**Endpoint**: `GET /charts?ticker={symbol}&mode={quarterly|ttm}`

```tsx
await actions.fetchCharts('AAPL', 'quarterly', authenticatedFetch);
// OR
await actions.fetchCharts('AAPL', 'ttm', authenticatedFetch);

// Access data
const chartsState = useChartsState();
console.log(chartsState.data);
```

**Response Structure**:
```json
{
  "ticker": "AAPL",
  "quarters": ["Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023"],
  "revenue": [94930000000, 81797000000, 89498000000, 119575000000],
  "eps": [1.52, 1.26, 1.46, 2.18],
  "gross_margin": [43.3, 44.5, 45.2, 46.1],
  "net_margin": [25.3, 24.7, 26.4, 27.2],
  "operating_income": [28360000000, 24126000000, 27568000000, 35056000000],
  "operating_cash_flow": [34545000000, 26695000000, 29180000000, 38044000000],
  "free_cash_flow": [31234000000, 23890000000, 26123000000, 34567000000]
}
```

**Cache Key**: `{ticker}_{mode}` (e.g., "AAPL_quarterly", "AAPL_ttm")

---

### fetchProjections
**Endpoint**: `GET /projections?ticker={symbol}`

```tsx
await actions.fetchProjections('AAPL', authenticatedFetch);

// Access data
const projectionsState = useProjectionsState();
console.log(projectionsState.baseData);
```

**Response Structure**:
```json
{
  "ticker": "AAPL",
  "revenue": 383285000000,
  "net_income": 96995000000,
  "eps": 6.16,
  "net_income_margin": 25.31,
  "data_year": 2023
}
```

---

### fetchFinancials
**Endpoint**: `GET /financials?ticker={symbol}`

```tsx
await actions.fetchFinancials('AAPL', authenticatedFetch);

// Access data
const financialsState = useFinancialsState();
console.log(financialsState.data);
```

**Response Structure**:
```json
{
  "ticker": "AAPL",
  "historical": [
    {
      "fiscalYear": "2023",
      "totalRevenue": 383285000000,
      "costOfRevenue": 214137000000,
      "grossProfit": 169148000000,
      "sellingGeneralAndAdministrative": 24932000000,
      "researchAndDevelopment": 29915000000,
      "operatingExpenses": 54847000000,
      "operatingIncome": 114301000000,
      "netIncome": 96995000000,
      "eps": 6.16,
      "dilutedEps": 6.13
    },
    {
      "fiscalYear": "2022",
      "totalRevenue": 394328000000,
      "costOfRevenue": 223546000000,
      "grossProfit": 170782000000,
      "operatingIncome": 119437000000,
      "netIncome": 99803000000,
      "eps": 6.15,
      "dilutedEps": 6.11
    }
  ],
  "estimates": [
    {
      "fiscalYear": "2024",
      "totalRevenue": 391151000000,
      "netIncome": 101234000000,
      "eps": 6.57,
      "dilutedEps": 6.54
    },
    {
      "fiscalYear": "2025",
      "totalRevenue": 420543000000,
      "netIncome": 108567000000,
      "eps": 7.05,
      "dilutedEps": 7.02
    }
  ]
}
```

## Direct Fetch Patterns

For custom endpoints not in the store:

### GET Request
```tsx
const { authenticatedFetch } = useAuthenticatedFetch();

const fetchCustomData = async () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  try {
    const response = await authenticatedFetch(
      `${apiUrl}/custom-endpoint?param=value`
    );
    
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
```

### POST Request
```tsx
const postData = async (payload: any) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  const response = await authenticatedFetch(`${apiUrl}/endpoint`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Request failed");
  }
  
  return await response.json();
};
```

## Caching Strategy

The Zustand store implements client-side caching:

1. **Check cache first**: Before making API call
2. **Return cached data**: If available
3. **Fetch from API**: If cache miss
4. **Update cache**: Store response for future use

**Cache Structure**:
```tsx
cache: {
  stockInfo: { [ticker: string]: StockInfo },
  metrics: { [ticker: string]: FinancialMetrics },
  charts: { [cacheKey: string]: ChartData }, // cacheKey: "TICKER_MODE"
  projections: { [ticker: string]: ProjectionBaseData },
  financials: { [ticker: string]: FinancialsData }
}
```

**Manual Cache Access**:
```tsx
const actions = useStockActions();

// Get cached data
const cached = actions.getCachedMetrics('AAPL');

// Clear cache (if needed - not currently exposed)
// Store would need a clearCache action
```

## Complete Example: Fetching Data

```tsx
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { useChartsState, useStockActions, useStockInfo } from "~/store/stockStore";
import { useState } from "react";

export default function ChartsExample() {
  const [ticker, setTicker] = useState("AAPL");
  const [viewMode, setViewMode] = useState<"quarterly" | "ttm">("quarterly");
  
  const { authenticatedFetch, isSignedIn } = useAuthenticatedFetch();
  const chartsState = useChartsState();
  const stockInfo = useStockInfo();
  const actions = useStockActions();
  
  const loadData = async () => {
    if (!isSignedIn) {
      console.error("User not signed in");
      return;
    }
    
    // Set loading state
    actions.setChartsLoading(true);
    actions.setChartsError(null);
    actions.setStockInfoLoading(true);
    actions.setGlobalTicker(ticker);
    
    try {
      // Fetch both charts and stock info concurrently
      const [chartsResult, stockInfoResult] = await Promise.allSettled([
        actions.fetchCharts(ticker, viewMode, authenticatedFetch),
        actions.fetchStockInfo(ticker, authenticatedFetch)
      ]);
      
      // Handle charts result
      if (chartsResult.status === 'fulfilled') {
        actions.setChartsData(chartsResult.value);
      } else {
        console.error("Charts error:", chartsResult.reason);
        actions.setChartsError(
          chartsResult.reason instanceof Error 
            ? chartsResult.reason.message 
            : "Failed to load charts"
        );
      }
      
      // Stock info automatically handled by fetchStockInfo action
      if (stockInfoResult.status === 'rejected') {
        console.error("Stock info error:", stockInfoResult.reason);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      actions.setChartsError("An unexpected error occurred");
    } finally {
      actions.setChartsLoading(false);
      actions.setStockInfoLoading(false);
    }
  };
  
  return (
    <div>
      <button onClick={loadData}>Load Charts</button>
      
      {chartsState.loading && <p>Loading...</p>}
      {chartsState.error && <p>Error: {chartsState.error}</p>}
      {chartsState.data && (
        <div>
          <h2>{stockInfo.data?.ticker} - ${stockInfo.data?.price}</h2>
          {/* Render charts */}
        </div>
      )}
    </div>
  );
}
```

## TypeScript Interfaces

### Request/Response Types

All TypeScript interfaces are defined in `app/store/stockStore.ts`:

```tsx
interface FinancialMetrics {
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
  ticker: string | null;
}

interface StockInfo {
  ticker: string;
  price: number;
  market_cap: number;
  shares_outstanding: number;
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

interface ProjectionBaseData {
  ticker: string;
  revenue: number | null;
  net_income: number | null;
  eps: number | null;
  net_income_margin: number | null;
  data_year: number;
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
  sellingGeneralAndAdministrative: number | null;
  researchAndDevelopment: number | null;
  operatingExpenses: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  eps: number | null;
  dilutedEps: number | null;
}

interface EstimateData {
  fiscalYear: string;
  totalRevenue: number | null;
  netIncome: number | null;
  eps: number | null;
  dilutedEps: number | null;
}
```

## Best Practices

1. **Always use authenticated fetch** for protected endpoints
2. **Use store actions** for standard endpoints (caching included)
3. **Handle loading states** - set before/after async calls
4. **Handle errors gracefully** - display user-friendly messages
5. **Use TypeScript interfaces** - type all API responses
6. **Check user authentication** - before making protected calls
7. **Cache appropriately** - leverage store's built-in caching
8. **Use Promise.allSettled** - for concurrent requests that shouldn't fail together
9. **Log errors** - console.error for debugging
10. **Update global ticker** - `actions.setGlobalTicker()` for cross-page consistency

