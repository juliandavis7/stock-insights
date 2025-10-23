import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Interface definitions
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
  // Stock info fields removed - use centralized stockInfo state instead
}

interface ProjectionBaseData {
  ticker: string;
  // Stock info fields removed - use centralized stockInfo state instead
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

interface FinancialsData {
  ticker: string;
  // Stock info fields removed - use centralized stockInfo state instead
  historical: HistoricalData[];
  estimates: EstimateData[];
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
  // Stock info fields removed - use centralized stockInfo state instead
}

interface StockInfo {
  ticker: string;
  price: number;
  market_cap: number;
  shares_outstanding: number;
}

// Store state interface
interface StockStore {
  // Global ticker state - shared across all pages
  globalTicker: {
    currentTicker: string | null;
    isLoading: boolean;
  };
  
  // Global stock info - centralized stock data shared across pages
  stockInfo: {
    data: StockInfo | null;
    loading: boolean;
    error: string | null;
    lastFetchTicker: string | null; // Track which ticker was last fetched
    cacheExpiry: number | null; // Timestamp for cache expiration
  };
  
  // Search state
  search: {
    data: FinancialMetrics | null;
    loading: boolean;
    error: string | null;
  };
  
  // Compare state  
  compare: {
    tickers: [string, string, string];
    data: {
      [ticker: string]: FinancialMetrics | null;
    };
    loading: { [index: number]: boolean };
    errors: { [index: number]: string | null };
  };
  
  // Projections state
  projections: {
    baseData: ProjectionBaseData | null;
    projectionInputs: ProjectionInputs;
    calculatedProjections: CalculatedProjections;
    loading: boolean;
    error: string | null;
  };
  
  // Financials state
  financials: {
    data: FinancialsData | null;
    loading: boolean;
    error: string | null;
  };
  
  // Charts state
  charts: {
    data: ChartData | null;
    loading: boolean;
    error: string | null;
    viewMode: "quarterly" | "ttm";
  };
  
  // Global cache for all fetched data
  cache: {
    stockInfo: { [ticker: string]: { data: StockInfo; timestamp: number } };
    metrics: { [ticker: string]: FinancialMetrics };
    projections: { [ticker: string]: ProjectionBaseData };
    scenarioProjections: { [ticker: string]: { 
      base: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
      bull: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
      bear: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
      activeScenario: 'base' | 'bull' | 'bear';
    }};
    financials: { [ticker: string]: FinancialsData };
    charts: { [ticker: string]: ChartData };
  };

  // Actions
  actions: {
    // Global ticker actions
    setGlobalTicker: (ticker: string | null) => void;
    setGlobalLoading: (loading: boolean) => void;
    clearGlobalTicker: () => void;
    
    // Stock info actions
    setStockInfoData: (data: StockInfo) => void;
    setStockInfoLoading: (loading: boolean) => void;
    setStockInfoError: (error: string | null) => void;
    clearStockInfo: () => void;
    
    // Search actions
    setSearchData: (data: FinancialMetrics) => void;
    setSearchLoading: (loading: boolean) => void;
    setSearchError: (error: string | null) => void;
    
    // Compare actions
    setCompareTicker: (index: number, ticker: string) => void;
    setCompareData: (ticker: string, data: FinancialMetrics) => void;
    setCompareLoading: (index: number, loading: boolean) => void;
    setCompareError: (index: number, error: string | null) => void;
    
    // Projections actions
    setProjectionsBaseData: (data: ProjectionBaseData) => void;
    setProjectionsInputs: (inputs: ProjectionInputs) => void;
    setCalculatedProjections: (projections: CalculatedProjections) => void;
    setProjectionsLoading: (loading: boolean) => void;
    setProjectionsError: (error: string | null) => void;
    
    // Financials actions
    setFinancialsData: (data: FinancialsData) => void;
    setFinancialsLoading: (loading: boolean) => void;
    setFinancialsError: (error: string | null) => void;
    
    // Charts actions
    setChartsData: (data: ChartData) => void;
    setChartsLoading: (loading: boolean) => void;
    setChartsError: (error: string | null) => void;
    setChartsViewMode: (viewMode: "quarterly" | "ttm") => void;
    
    // Cache actions
    getCachedStockInfo: (ticker: string) => StockInfo | null;
    getCachedMetrics: (ticker: string) => FinancialMetrics | null;
    getCachedProjections: (ticker: string) => ProjectionBaseData | null;
    getCachedScenarioProjections: (ticker: string) => { 
      base: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
      bull: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
      bear: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
      activeScenario: 'base' | 'bull' | 'bear';
    } | null;
    setCachedScenarioProjections: (ticker: string, data: { 
      base: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
      bull: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
      bear: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
      activeScenario: 'base' | 'bull' | 'bear';
    }) => void;
    clearScenarioProjectionsCache: (ticker?: string) => void;
    getCachedFinancials: (ticker: string) => FinancialsData | null;
    getCachedCharts: (ticker: string) => ChartData | null;
    
    // API actions
    fetchStockInfo: (ticker: string) => Promise<StockInfo>;
    fetchMetrics: (ticker: string) => Promise<FinancialMetrics>;
    fetchProjections: (ticker: string) => Promise<ProjectionBaseData>;
    fetchFinancials: (ticker: string) => Promise<FinancialsData>;
    fetchCharts: (ticker: string, mode?: string) => Promise<ChartData>;
  };
}

const currentYear = new Date().getFullYear();
const projectionYears = [
  (currentYear + 1).toString(),
  (currentYear + 2).toString(),
  (currentYear + 3).toString(),
  (currentYear + 4).toString()
];

// Helper function to get initial ticker from localStorage or URL
const getInitialTicker = (): string | null => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') return null;
  
  // Try URL first
  const urlParams = new URLSearchParams(window.location.search);
  const urlTicker = urlParams.get('ticker');
  if (urlTicker) return urlTicker.toUpperCase();
  
  // Try localStorage
  const storedTicker = localStorage.getItem('globalTicker');
  if (storedTicker) return storedTicker.toUpperCase();
  
  return null;
};

export const useStockStore = create<StockStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      globalTicker: {
        currentTicker: getInitialTicker(),
        isLoading: false,
      },
      
      stockInfo: {
        data: null,
        loading: false,
        error: null,
        lastFetchTicker: null,
        cacheExpiry: null,
      },
      
      search: {
        data: null,
        loading: false,
        error: null,
      },
      
      compare: {
        tickers: ['AAPL', 'MSFT', 'GOOGL'],
        data: {},
        loading: { 0: false, 1: false, 2: false },
        errors: { 0: null, 1: null, 2: null },
      },
      
      projections: {
        baseData: null,
        projectionInputs: {
          revenueGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
          netIncomeGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
          peLow: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
          peHigh: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 }
        },
        calculatedProjections: {
          revenue: {},
          netIncome: {},
          netIncomeMargin: {},
          eps: {},
          sharePriceLow: {},
          sharePriceHigh: {},
          cagrLow: {},
          cagrHigh: {}
        },
        loading: false,
        error: null,
      },
      
      financials: {
        data: null,
        loading: false,
        error: null,
      },
      
      charts: {
        data: null,
        loading: false,
        error: null,
        viewMode: "quarterly",
      },
      
      cache: {
        stockInfo: {},
        metrics: {},
        projections: {},
        scenarioProjections: {},
        financials: {},
        charts: {},
      },

      actions: {
        // Global ticker actions
        setGlobalTicker: (ticker: string | null) => {
          const { actions } = get();
          
          // Clear stock info when switching to a new ticker
          if (ticker && ticker !== get().globalTicker.currentTicker) {
            actions.clearStockInfo();
          }
          
          set((state) => ({
            globalTicker: { ...state.globalTicker, currentTicker: ticker }
          }), false, 'setGlobalTicker');
          
          // Persist to localStorage and URL
          if (typeof window !== 'undefined') {
            if (ticker) {
              localStorage.setItem('globalTicker', ticker);
              const url = new URL(window.location);
              url.searchParams.set('ticker', ticker);
              window.history.replaceState({}, '', url);
            } else {
              localStorage.removeItem('globalTicker');
              const url = new URL(window.location);
              url.searchParams.delete('ticker');
              window.history.replaceState({}, '', url);
            }
          }
        },
        
        setGlobalLoading: (loading: boolean) => set((state) => ({
          globalTicker: { ...state.globalTicker, isLoading: loading }
        }), false, 'setGlobalLoading'),
        
        clearGlobalTicker: () => {
          set((state) => ({
            globalTicker: { currentTicker: null, isLoading: false }
          }), false, 'clearGlobalTicker');
          
          if (typeof window !== 'undefined') {
            localStorage.removeItem('globalTicker');
            const url = new URL(window.location);
            url.searchParams.delete('ticker');
            window.history.replaceState({}, '', url);
          }
        },
        
        // Stock info actions
        setStockInfoData: (data: StockInfo) => set((state) => ({
          stockInfo: { 
            ...state.stockInfo, 
            data,
            lastFetchTicker: data.ticker,
            cacheExpiry: Date.now() + (5 * 60 * 1000), // 5 minutes cache
            error: null
          },
          cache: {
            ...state.cache,
            stockInfo: {
              ...state.cache.stockInfo,
              [data.ticker]: { data, timestamp: Date.now() }
            }
          }
        }), false, 'setStockInfoData'),
        
        setStockInfoLoading: (loading: boolean) => set((state) => ({
          stockInfo: { ...state.stockInfo, loading }
        }), false, 'setStockInfoLoading'),
        
        setStockInfoError: (error: string | null) => set((state) => ({
          stockInfo: { ...state.stockInfo, error, loading: false }
        }), false, 'setStockInfoError'),
        
        clearStockInfo: () => set((state) => ({
          stockInfo: {
            data: null,
            loading: false,
            error: null,
            lastFetchTicker: null,
            cacheExpiry: null,
          }
        }), false, 'clearStockInfo'),
        
        // Search actions
        setSearchData: (data: FinancialMetrics) => set((state) => ({
          search: { ...state.search, data },
          cache: { 
            ...state.cache, 
            metrics: { ...state.cache.metrics, [data.ticker || '']: data }
          }
        }), false, 'setSearchData'),
        
        setSearchLoading: (loading: boolean) => set((state) => ({
          search: { ...state.search, loading }
        }), false, 'setSearchLoading'),
        
        setSearchError: (error: string | null) => set((state) => ({
          search: { ...state.search, error }
        }), false, 'setSearchError'),

        // Compare actions
        setCompareTicker: (index: number, ticker: string) => set((state) => {
          const newTickers = [...state.compare.tickers] as [string, string, string];
          newTickers[index] = ticker;
          return {
            compare: { ...state.compare, tickers: newTickers }
          };
        }, false, 'setCompareTicker'),
        
        setCompareData: (ticker: string, data: FinancialMetrics) => set((state) => ({
          compare: { 
            ...state.compare, 
            data: { ...state.compare.data, [ticker]: data }
          },
          cache: { 
            ...state.cache, 
            metrics: { ...state.cache.metrics, [ticker]: data }
          }
        }), false, 'setCompareData'),
        
        setCompareLoading: (index: number, loading: boolean) => set((state) => ({
          compare: { 
            ...state.compare, 
            loading: { ...state.compare.loading, [index]: loading }
          }
        }), false, 'setCompareLoading'),
        
        setCompareError: (index: number, error: string | null) => set((state) => ({
          compare: { 
            ...state.compare, 
            errors: { ...state.compare.errors, [index]: error }
          }
        }), false, 'setCompareError'),

        // Projections actions
        setProjectionsBaseData: (data: ProjectionBaseData) => set((state) => ({
          projections: { ...state.projections, baseData: data },
          cache: { 
            ...state.cache, 
            projections: { ...state.cache.projections, [data.ticker]: data }
          }
        }), false, 'setProjectionsBaseData'),
        
        setProjectionsInputs: (inputs: ProjectionInputs) => set((state) => ({
          projections: { ...state.projections, projectionInputs: inputs }
        }), false, 'setProjectionsInputs'),
        
        setCalculatedProjections: (projections: CalculatedProjections) => set((state) => ({
          projections: { ...state.projections, calculatedProjections: projections }
        }), false, 'setCalculatedProjections'),
        
        setProjectionsLoading: (loading: boolean) => set((state) => ({
          projections: { ...state.projections, loading }
        }), false, 'setProjectionsLoading'),
        
        setProjectionsError: (error: string | null) => set((state) => ({
          projections: { ...state.projections, error }
        }), false, 'setProjectionsError'),

        // Financials actions
        setFinancialsData: (data: FinancialsData) => set((state) => ({
          financials: { ...state.financials, data },
          cache: { 
            ...state.cache, 
            financials: { ...state.cache.financials, [data.ticker]: data }
          }
        }), false, 'setFinancialsData'),
        
        setFinancialsLoading: (loading: boolean) => set((state) => ({
          financials: { ...state.financials, loading }
        }), false, 'setFinancialsLoading'),
        
        setFinancialsError: (error: string | null) => set((state) => ({
          financials: { ...state.financials, error }
        }), false, 'setFinancialsError'),

        // Charts actions
        setChartsData: (data: ChartData) => set((state) => ({
          charts: { ...state.charts, data },
          cache: { 
            ...state.cache, 
            charts: { ...state.cache.charts, [data.ticker]: data }
          }
        }), false, 'setChartsData'),
        
        setChartsLoading: (loading: boolean) => set((state) => ({
          charts: { ...state.charts, loading }
        }), false, 'setChartsLoading'),
        
        setChartsError: (error: string | null) => set((state) => ({
          charts: { ...state.charts, error }
        }), false, 'setChartsError'),
        
        setChartsViewMode: (viewMode: "quarterly" | "ttm") => set((state) => ({
          charts: { ...state.charts, viewMode }
        }), false, 'setChartsViewMode'),

        // Cache actions
        getCachedStockInfo: (ticker: string) => {
          const state = get();
          const cached = state.cache.stockInfo[ticker];
          
          if (!cached) return null;
          
          // Check if cache is expired (5 minutes)
          const isExpired = Date.now() - cached.timestamp > (5 * 60 * 1000);
          if (isExpired) {
            // Remove expired cache
            set((state) => {
              const newStockInfoCache = { ...state.cache.stockInfo };
              delete newStockInfoCache[ticker];
              return {
                cache: {
                  ...state.cache,
                  stockInfo: newStockInfoCache
                }
              };
            }, false, 'removeExpiredStockInfoCache');
            return null;
          }
          
          return cached.data;
        },
        
        getCachedMetrics: (ticker: string) => {
          const state = get();
          return state.cache.metrics[ticker] || null;
        },
        
        getCachedProjections: (ticker: string) => {
          const state = get();
          return state.cache.projections[ticker] || null;
        },
        
        getCachedScenarioProjections: (ticker: string) => {
          const state = get();
          return state.cache.scenarioProjections[ticker] || null;
        },
        
        setCachedScenarioProjections: (ticker: string, data: { 
          base: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
          bull: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
          bear: { projectionInputs: ProjectionInputs; calculatedProjections: CalculatedProjections };
          activeScenario: 'base' | 'bull' | 'bear';
        }) => {
          set((state) => ({
            cache: { 
              ...state.cache, 
              scenarioProjections: { ...state.cache.scenarioProjections, [ticker]: data }
            }
          }), false, 'setCachedScenarioProjections');
        },
        
        clearScenarioProjectionsCache: (ticker?: string) => {
          set((state) => ({
            cache: { 
              ...state.cache, 
              scenarioProjections: ticker ? 
                Object.fromEntries(Object.entries(state.cache.scenarioProjections).filter(([key]) => key !== ticker)) :
                {}
            }
          }), false, 'clearScenarioProjectionsCache');
        },
        
        getCachedFinancials: (ticker: string) => {
          const state = get();
          return state.cache.financials[ticker] || null;
        },
        
        getCachedCharts: (ticker: string) => {
          const state = get();
          return state.cache.charts[ticker] || null;
        },

        // API actions
        fetchStockInfo: async (ticker: string): Promise<StockInfo> => {
          const { actions, cache } = get();
          
          // Clear stock info if we're fetching for a different ticker
          const currentTicker = get().stockInfo.lastFetchTicker;
          if (currentTicker && currentTicker !== ticker) {
            actions.clearStockInfo();
          }
          
          // Check cache first
          const cached = actions.getCachedStockInfo(ticker);
          if (cached) {
            console.log(`Using cached stock info for ${ticker}`);
            // Update stock info state even when using cached data
            actions.setStockInfoData(cached);
            return cached;
          }
          
          console.log(`Fetching stock info for ${ticker}`);
          const fastApiUrl = import.meta.env.VITE_FASTAPI_URL || "http://127.0.0.1:8000";
          const response = await fetch(`${fastApiUrl}/info?ticker=${ticker.toUpperCase()}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `API request failed: ${response.status} ${response.statusText}`);
          }
          
          const data: StockInfo = await response.json();
          
          // Cache the data and update state
          actions.setStockInfoData(data);
          
          return data;
        },
        
        fetchMetrics: async (ticker: string): Promise<FinancialMetrics> => {
          const { actions, cache } = get();
          
          // Check cache first
          const cached = cache.metrics[ticker];
          if (cached) {
            console.log(`Using cached metrics for ${ticker}`);
            return cached;
          }
          
          console.log(`Fetching metrics for ${ticker}`);
          const fastApiUrl = import.meta.env.VITE_FASTAPI_URL || "http://127.0.0.1:8000";
          const response = await fetch(`${fastApiUrl}/metrics?ticker=${ticker.toUpperCase()}`);
          
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }
          
          const data: FinancialMetrics = await response.json();
          
          // Cache the data
          set((state) => ({
            cache: { 
              ...state.cache, 
              metrics: { ...state.cache.metrics, [ticker]: data }
            }
          }), false, 'cacheMetrics');
          
          return data;
        },
        
        fetchProjections: async (ticker: string): Promise<ProjectionBaseData> => {
          const { cache } = get();
          
          // Check cache first
          const cached = cache.projections[ticker];
          if (cached) {
            console.log(`Using cached projections for ${ticker}`);
            return cached;
          }
          
          console.log(`Fetching projections for ${ticker}`);
          const response = await fetch(`http://localhost:8000/projections?ticker=${ticker.toUpperCase()}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail?.error || `Failed to fetch data for ${ticker}`);
          }
          
          const data: ProjectionBaseData = await response.json();
          
          // Cache the data
          set((state) => ({
            cache: { 
              ...state.cache, 
              projections: { ...state.cache.projections, [ticker]: data }
            }
          }), false, 'cacheProjections');
          
          return data;
        },
        
        fetchFinancials: async (ticker: string): Promise<FinancialsData> => {
          const { cache } = get();
          
          // Check cache first
          const cached = cache.financials[ticker];
          if (cached) {
            console.log(`Using cached financials for ${ticker}`);
            return cached;
          }
          
          console.log(`Fetching financials for ${ticker}`);
          const response = await fetch(`http://localhost:8000/financials?ticker=${ticker.toUpperCase()}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail?.error || `Failed to fetch financials for ${ticker}`);
          }
          
          const data: FinancialsData = await response.json();
          
          // Cache the data
          set((state) => ({
            cache: { 
              ...state.cache, 
              financials: { ...state.cache.financials, [ticker]: data }
            }
          }), false, 'cacheFinancials');
          
          return data;
        },
        
        fetchCharts: async (ticker: string, mode: string = 'quarterly'): Promise<ChartData> => {
          const { cache } = get();
          
          // Create cache key that includes both ticker and mode
          const cacheKey = `${ticker}_${mode}`;
          
          // Check cache first
          const cached = cache.charts[cacheKey];
          if (cached) {
            console.log(`Using cached charts for ${ticker} (${mode})`);
            return cached;
          }
          
          console.log(`Fetching charts for ${ticker} (${mode})`);
          const response = await fetch(`http://localhost:8000/charts?ticker=${ticker.toUpperCase()}&mode=${mode}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail?.error || `Failed to fetch charts for ${ticker}`);
          }
          
          const data: ChartData = await response.json();
          
          // Cache the data with mode-specific key
          set((state) => ({
            cache: { 
              ...state.cache, 
              charts: { ...state.cache.charts, [cacheKey]: data }
            }
          }), false, 'cacheCharts');
          
          return data;
        },
      },
    }),
    { name: 'stock-store' }
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