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
  price: number | null;
  market_cap: number | null;
}

interface ProjectionBaseData {
  ticker: string;
  price: number;
  market_cap: number;
  shares_outstanding: number;
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

// Store state interface
interface StockStore {
  // Search state
  search: {
    currentTicker: string;
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
    currentTicker: string;
    baseData: ProjectionBaseData | null;
    projectionInputs: ProjectionInputs;
    calculatedProjections: CalculatedProjections;
    loading: boolean;
    error: string | null;
  };
  
  // Global cache for all fetched data
  cache: {
    metrics: { [ticker: string]: FinancialMetrics };
    projections: { [ticker: string]: ProjectionBaseData };
  };

  // Actions
  actions: {
    // Search actions
    setSearchTicker: (ticker: string) => void;
    setSearchData: (data: FinancialMetrics) => void;
    setSearchLoading: (loading: boolean) => void;
    setSearchError: (error: string | null) => void;
    
    // Compare actions
    setCompareTicker: (index: number, ticker: string) => void;
    setCompareData: (ticker: string, data: FinancialMetrics) => void;
    setCompareLoading: (index: number, loading: boolean) => void;
    setCompareError: (index: number, error: string | null) => void;
    
    // Projections actions
    setProjectionsTicker: (ticker: string) => void;
    setProjectionsBaseData: (data: ProjectionBaseData) => void;
    setProjectionsInputs: (inputs: ProjectionInputs) => void;
    setCalculatedProjections: (projections: CalculatedProjections) => void;
    setProjectionsLoading: (loading: boolean) => void;
    setProjectionsError: (error: string | null) => void;
    
    // Cache actions
    getCachedMetrics: (ticker: string) => FinancialMetrics | null;
    getCachedProjections: (ticker: string) => ProjectionBaseData | null;
    
    // API actions
    fetchMetrics: (ticker: string) => Promise<FinancialMetrics>;
    fetchProjections: (ticker: string) => Promise<ProjectionBaseData>;
  };
}

const currentYear = new Date().getFullYear();
const projectionYears = [
  (currentYear + 1).toString(),
  (currentYear + 2).toString(),
  (currentYear + 3).toString(),
  (currentYear + 4).toString()
];

export const useStockStore = create<StockStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      search: {
        currentTicker: 'AAPL',
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
        currentTicker: 'AAPL',
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
      
      cache: {
        metrics: {},
        projections: {},
      },

      actions: {
        // Search actions
        setSearchTicker: (ticker: string) => set((state) => ({
          search: { ...state.search, currentTicker: ticker }
        }), false, 'setSearchTicker'),
        
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
        setProjectionsTicker: (ticker: string) => set((state) => ({
          projections: { ...state.projections, currentTicker: ticker }
        }), false, 'setProjectionsTicker'),
        
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

        // Cache actions
        getCachedMetrics: (ticker: string) => {
          const state = get();
          return state.cache.metrics[ticker] || null;
        },
        
        getCachedProjections: (ticker: string) => {
          const state = get();
          return state.cache.projections[ticker] || null;
        },

        // API actions
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
      },
    }),
    { name: 'stock-store' }
  )
);

// Export individual selectors for better performance
export const useSearchState = () => useStockStore((state) => state.search);
export const useCompareState = () => useStockStore((state) => state.compare);
export const useProjectionsState = () => useStockStore((state) => state.projections);
export const useStockActions = () => useStockStore((state) => state.actions);