import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { AppLayout } from "~/components/app-layout";
import { StockSearchHeader } from "~/components/stock-search-header";
import { useProjectionsState, useStockActions, useGlobalTicker, useStockInfo } from "~/store/stockStore";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { useSubscriptionCheck } from "~/hooks/useSubscriptionCheck";
import { getAuth } from "@clerk/react-router/ssr.server";
import { createClerkClient } from "@clerk/react-router/api.server";
import { redirect } from "react-router";
import { RotateCcw, Info, RefreshCw } from "lucide-react";
import type { Route } from "./+types/projections";
import { BRAND_NAME } from "~/config/brand";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Financial Projections - ${BRAND_NAME}` },
    { name: "description", content: "Create custom financial projections for stocks" },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const { protectedRouteLoader } = await import("~/lib/routeProtection");
  return protectedRouteLoader(args);
}

interface StockInfo {
  ticker: string;
  price: number | null;
  marketCap: number | null;
  sharesOutstanding: number | null;
}

interface BaseFinancialData {
  revenue: number | null;
  netIncome: number | null;
  netIncomeMargin: number | null;
  eps: number | null;
}

interface ProjectionApiResponse {
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

// Helper function to format number - only remove .00 for 0 and 100
const formatNumberValue = (num: number): string => {
  const rounded = parseFloat(num.toFixed(2));
  // Only remove .00 for exactly 0 or 100
  if (rounded === 0 || rounded === 100) {
    return rounded.toString();
  }
  return num.toFixed(2);
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || value === 0) return "$0";
  const absValue = Math.abs(value);
  if (absValue >= 1e12) {
    return `$${formatNumberValue(value / 1e12)}T`;
  } else if (absValue >= 1e9) {
    return `$${formatNumberValue(value / 1e9)}B`;
  } else if (absValue >= 1e6) {
    return `$${formatNumberValue(value / 1e6)}M`;
  }
  return `$${formatNumberValue(value)}`;
};

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || value === 0) return "0%";
  return `${formatNumberValue(value)}%`;
};

const formatMarginPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "0%";
  return `${Math.round(value)}%`;
};

const formatRoundedCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || value === 0) return "$0";
  const roundedValue = Math.round(value);
  const absRoundedValue = Math.abs(roundedValue);
  if (absRoundedValue >= 1e12) {
    return `$${Math.round(roundedValue / 1e12)}T`;
  } else if (absRoundedValue >= 1e9) {
    return `$${Math.round(roundedValue / 1e9)}B`;
  } else if (absRoundedValue >= 1e6) {
    return `$${Math.round(roundedValue / 1e6)}M`;
  }
  return `$${roundedValue}`;
};

const formatRoundedPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || value === 0) return "0%";
  return `${Math.round(value)}%`;
};

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return value.toLocaleString();
};

const currentYear = new Date().getFullYear();
const projectionYears = [
  (currentYear + 1).toString(),
  (currentYear + 2).toString(),
  (currentYear + 3).toString(),
  (currentYear + 4).toString()
];

export default function ProjectionsPage({ loaderData }: Route.ComponentProps) {
  // Check subscription status and redirect if expired
  useSubscriptionCheck();
  // Remove spinner arrows from number inputs
  const inputStyle = {
    MozAppearance: 'textfield' as const,
    WebkitAppearance: 'none' as const,
  };

  // Cursor color-coding styles
  const cursorStyles = `
    /* Default cursor state - system default */
    * {
      cursor: default;
    }
    
    /* Interactive elements - soft primary accent */
    button, 
    input[type="text"], 
    input[type="number"], 
    select, 
    [role="button"],
    .cursor-pointer {
      cursor: pointer !important;
    }
    
    /* Hover state - soft primary blue */
    button:hover,
    input:hover,
    select:hover,
    [role="button"]:hover,
    .cursor-pointer:hover {
      cursor: pointer !important;
    }
    
    /* Active/Press state - slightly darker blue */
    button:active,
    input:active,
    select:active,
    [role="button"]:active,
    .cursor-pointer:active {
      cursor: pointer !important;
    }
    
    /* Disabled state - desaturated gray */
    button:disabled,
    input:disabled,
    select:disabled,
    [aria-disabled="true"],
    .cursor-not-allowed {
      cursor: not-allowed !important;
    }
    
    /* Right-align placeholder text */
    input[type="text"]::placeholder,
    input[type="number"]::placeholder {
      text-align: right;
    }
  `;

  // Handle percentage input formatting
  const handlePercentageInputChange = (metric: 'revenueGrowth' | 'netIncomeGrowth', year: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const activeData = getActiveScenarioData();
    
    if (!activeData?.projectionInputs) return;
    
    const updated = {
      ...activeData.projectionInputs,
      [metric]: {
        ...activeData.projectionInputs[metric],
        [year]: numValue
      }
    };
    
    updateScenarioData({ projectionInputs: updated });
    
    // Trigger recalculation after state update
    setTimeout(() => recalculateProjectionsForScenario(updated), 0);
  };

  // Handle Enter key to move to next input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, metric: string, currentYear: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentIndex = projectionYears.indexOf(currentYear);
      const nextYear = projectionYears[currentIndex + 1];
      
      if (nextYear) {
        // Focus next year for same metric
        const nextInput = document.getElementById(`${metric}-${nextYear}`);
        if (nextInput) {
          nextInput.focus();
        }
      } else {
        // If at last year, move to next metric's first year
        let nextMetric = '';
        if (metric === 'revenue-growth') {
          nextMetric = 'net-income-growth';
        } else if (metric === 'net-income-growth') {
          nextMetric = 'pe-low';
        } else if (metric === 'pe-low') {
          nextMetric = 'pe-high';
        } else if (metric === 'pe-high') {
          // After pe-high, go back to revenue-growth for next year or stop
          nextMetric = 'revenue-growth';
        }
        
        if (nextMetric) {
          // For pe-low and pe-high, start with current year (2025), otherwise use first projection year
          const actualCurrentYear = new Date().getFullYear();
          const targetYear = (nextMetric === 'pe-low' || nextMetric === 'pe-high') ? actualCurrentYear.toString() : projectionYears[0];
          const nextInput = document.getElementById(`${nextMetric}-${targetYear}`);
          if (nextInput) {
            nextInput.focus();
          }
        }
      }
    }
  };

  // Format percentage values for display
  const formatPercentageInput = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value) || value === 0) {
      return '';
    }
    return `${value}%`;
  };

  // Calculation functions
  const calculateProjectedRevenue = (previousRevenue: number, growthRate: number): number => {
    if (!previousRevenue || isNaN(previousRevenue) || isNaN(growthRate)) return 0;
    if (growthRate === 0) return 0; // Return 0 when no growth rate is entered
    return previousRevenue * (1 + growthRate / 100);
  };

  const calculateNetIncomeMargin = (netIncome: number, revenue: number): number => {
    if (!netIncome || isNaN(netIncome) || !revenue || isNaN(revenue) || revenue === 0) return 0;
    return (netIncome / revenue) * 100;
  };

  const calculateNetIncomeFromGrowth = (previousNetIncome: number, growthRate: number): number => {
    if (!previousNetIncome || isNaN(previousNetIncome) || isNaN(growthRate)) return 0;
    if (growthRate === 0) return 0; // Return 0 when no growth rate is entered
    return previousNetIncome * (1 + growthRate / 100);
  };

  const calculateEPS = (netIncome: number, sharesOutstanding: number): number => {
    if (!netIncome || isNaN(netIncome) || !sharesOutstanding || isNaN(sharesOutstanding) || sharesOutstanding === 0) return 0;
    return netIncome / sharesOutstanding;
  };

  const calculateStockPrice = (eps: number, peRatio: number): number => {
    if (!eps || isNaN(eps) || !peRatio || isNaN(peRatio) || peRatio === 0) return 0;
    return eps * peRatio;
  };

  const calculateCAGR = (finalValue: number, initialValue: number, years: number): number => {
    if (!finalValue || isNaN(finalValue) || !initialValue || isNaN(initialValue) || initialValue === 0 || !years || isNaN(years) || years === 0) return 0;
    return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
  };

  const calculateNetIncomeGrowthRate = (currentNetIncome: number, previousNetIncome: number): number => {
    if (!currentNetIncome || isNaN(currentNetIncome) || !previousNetIncome || isNaN(previousNetIncome) || previousNetIncome === 0) return 0;
    const growthRate = ((currentNetIncome / previousNetIncome) - 1) * 100;
    return Math.round(growthRate * 100) / 100; // Round to 2 decimal places
  };
  const projectionsState = useProjectionsState();
  const globalTicker = useGlobalTicker();
  const stockInfo = useStockInfo();
  const actions = useStockActions();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [stockSymbol, setStockSymbol] = useState(globalTicker.currentTicker || 'AAPL');
  const [showForwardButton, setShowForwardButton] = useState<{[key: string]: boolean}>({});
  const [appliedCells, setAppliedCells] = useState<{[key: string]: boolean}>({});
  const [showMetricTooltip, setShowMetricTooltip] = useState(false);
  const [metricTooltipCoords, setMetricTooltipCoords] = useState({ top: 0, left: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const metricButtonRef = useRef<HTMLButtonElement>(null);
  
  // Scenario management
  type ScenarioType = 'base' | 'bull' | 'bear';
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('base');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [scenarioData, setScenarioData] = useState<{
    [K in ScenarioType]: {
      projectionInputs: ProjectionInputs;
      calculatedProjections: CalculatedProjections;
    }
  }>({
    base: {
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
      }
    },
    bull: {
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
      }
    },
    bear: {
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
      }
    }
  });

  // Sample data for initial display
  const sampleStockInfo: StockInfo = {
    ticker: "CELH",
    price: 32.39,
    marketCap: 8.49e9,
    sharesOutstanding: 231787480
  };

  const sampleBaseData: BaseFinancialData = {
    revenue: 1.34e9,
    netIncome: 201.5e6,
    netIncomeMargin: 15.04,
    eps: 0.87
  };

  const currentYearMargin = 15.04;

  const handleTickerChange = (ticker: string) => {
    setStockSymbol(ticker.toUpperCase());
  };

  const handleProjectionInputChange = (metric: keyof ProjectionInputs, year: string, value: number) => {
    const activeData = getActiveScenarioData();
    if (!activeData?.projectionInputs) return;
    
    const updated = {
      ...activeData.projectionInputs,
      [metric]: {
        ...activeData.projectionInputs[metric],
        [year]: value
      }
    };
    
    updateScenarioData({ projectionInputs: updated });
    
    // Trigger recalculation after state update
    setTimeout(() => recalculateProjectionsForScenario(updated), 0);
  };

  const performSearch = async () => {
    if (!stockSymbol.trim()) {
      actions.setProjectionsError("Please enter a valid ticker symbol");
      return;
    }
    
    actions.setProjectionsLoading(true);
    actions.setProjectionsError(null);
    actions.setStockInfoLoading(true);
    actions.setGlobalTicker(stockSymbol); // Set global ticker
    setIsInitialLoad(true); // Reset initial load flag for new search
    
    try {
      // Fetch both projections and stock info concurrently
      const [projectionsPromise, stockInfoPromise] = await Promise.allSettled([
        // Check cache first for projections, then fetch if needed
        (async () => {
          const cachedData = actions.getCachedProjections(stockSymbol);
          if (cachedData) return cachedData;
          return await actions.fetchProjections(stockSymbol, authenticatedFetch);
        })(),
        // Fetch stock info (handles its own caching)
        actions.fetchStockInfo(stockSymbol, authenticatedFetch)
      ]);
      
      // Handle projections result
      if (projectionsPromise.status === 'fulfilled') {
        actions.setProjectionsBaseData(projectionsPromise.value);
      } else {
        console.error("Error fetching projections:", projectionsPromise.reason);
        const errorMessage = projectionsPromise.reason instanceof Error ? projectionsPromise.reason.message : "Error fetching projections";
        actions.setProjectionsError(errorMessage);
        
        // If ticker not found, clear the projections data
        if (errorMessage.toLowerCase().includes('not found') || 
            errorMessage.toLowerCase().includes('404') ||
            errorMessage.toLowerCase().includes('does not exist') ||
            errorMessage.toLowerCase().includes('failed to fetch data for')) {
          actions.setProjectionsBaseData({
            ticker: stockSymbol,
            revenue: 0,
            net_income: 0,
            eps: 0,
            net_income_margin: 0,
            data_year: new Date().getFullYear()
          });
        }
      }
      
      // Stock info is automatically handled by the fetchStockInfo action
      if (stockInfoPromise.status === 'rejected') {
        console.error("Error fetching stock info:", stockInfoPromise.reason);
        actions.setStockInfoError(stockInfoPromise.reason instanceof Error ? stockInfoPromise.reason.message : "Error fetching stock info");
      }
      
      // Clear scenario projections cache only for the new ticker being searched
      console.log(`🗑️ Clearing scenario projections cache for new ticker: ${stockSymbol}`);
      actions.clearScenarioProjectionsCache(stockSymbol);
      
      // Reset scenario data to initial state
      const clearedInputs = {
        revenueGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
        netIncomeGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
        peLow: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
        peHigh: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 }
      };
      
      const clearedCalculations = {
        revenue: {},
        netIncome: {},
        netIncomeMargin: {},
        eps: {},
        sharePriceLow: {},
        sharePriceHigh: {},
        cagrLow: {},
        cagrHigh: {}
      };

      setScenarioData({
        base: { projectionInputs: clearedInputs, calculatedProjections: clearedCalculations },
        bull: { projectionInputs: clearedInputs, calculatedProjections: clearedCalculations },
        bear: { projectionInputs: clearedInputs, calculatedProjections: clearedCalculations }
      });
      setActiveScenario('base');
      
      // Also clear the global projections state for backward compatibility
      actions.setProjectionsInputs(clearedInputs);
      actions.setCalculatedProjections(clearedCalculations);
      
    } catch (err) {
      console.error('Unexpected error:', err);
      actions.setProjectionsError(err instanceof Error ? err.message : 'Unexpected error occurred');
      actions.setStockInfoError(err instanceof Error ? err.message : 'Unexpected error occurred');
    } finally {
      actions.setProjectionsLoading(false);
      actions.setStockInfoLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch();
  };

  // Scenario management functions
  const handleScenarioChange = (scenario: ScenarioType) => {
    setActiveScenario(scenario);
  };

  const getActiveScenarioData = () => {
    return scenarioData[activeScenario];
  };

  const updateScenarioData = (updates: Partial<typeof scenarioData.base>) => {
    setScenarioData(prev => {
      const newScenarioData = {
        ...prev,
        [activeScenario]: {
          ...prev[activeScenario],
          ...updates
        }
      };
      
      
      return newScenarioData;
    });
  };

  const handleResetAllProjections = () => {
    // Clear all user inputs for ALL scenarios
    const clearedInputs = {
      revenueGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
      netIncomeGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
      peLow: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
      peHigh: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 }
    };
    
    const clearedCalculations = {
      revenue: {},
      netIncome: {},
      netIncomeMargin: {},
      eps: {},
      sharePriceLow: {},
      sharePriceHigh: {},
      cagrLow: {},
      cagrHigh: {}
    };

    // Reset all three scenarios
    setScenarioData({
      base: { projectionInputs: clearedInputs, calculatedProjections: clearedCalculations },
      bull: { projectionInputs: clearedInputs, calculatedProjections: clearedCalculations },
      bear: { projectionInputs: clearedInputs, calculatedProjections: clearedCalculations }
    });
    setActiveScenario('base');

    // Clear cache for current ticker when resetting
    if (stockSymbol) {
      console.log(`🗑️ Clearing scenario projections cache for reset: ${stockSymbol}`);
      actions.clearScenarioProjectionsCache(stockSymbol);
    }
  };

  const handleForwardApply = (metric: keyof ProjectionInputs, fromYear: string) => {
    const activeData = getActiveScenarioData();
    if (!activeData?.projectionInputs) return;
    
    const currentValue = activeData.projectionInputs[metric][fromYear] || 0;
    const fromIndex = projectionYears.indexOf(fromYear);
    const isCurrentYear = fromYear === currentYear.toString();
    const isPeMetric = metric === 'peLow' || metric === 'peHigh';
    
    // Don't apply from last projection year (2029), but allow current year (2025) for PE ratios
    if (fromIndex === projectionYears.length - 1) return;
    if (fromIndex === -1 && !(isCurrentYear && isPeMetric)) return;
    
    // Determine which years to apply to
    let allYears: string[];
    
    if (isCurrentYear && isPeMetric) {
      // From current year (2025) for PE ratios: apply to all projection years
      allYears = projectionYears;
    } else if (fromIndex !== -1) {
      // From projection year: apply to remaining future years
      allYears = projectionYears.slice(fromIndex + 1);
    } else {
      return; // Shouldn't reach here, but safety check
    }
    
    // Create updated inputs with the value applied to all future years
    const updated = {
      ...activeData.projectionInputs,
      [metric]: {
        ...activeData.projectionInputs[metric],
        ...allYears.reduce((acc, year) => ({ ...acc, [year]: currentValue }), {})
      }
    };
    
    updateScenarioData({ projectionInputs: updated });
    
    // Show visual feedback for applied cells
    const appliedKeys = allYears.map(year => `${metric}-${year}`);
    const newAppliedCells = appliedKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setAppliedCells(newAppliedCells);
    
    // Clear visual feedback after 1 second
    setTimeout(() => setAppliedCells({}), 1000);
    
    // Trigger recalculation
    setTimeout(() => recalculateProjectionsForScenario(updated), 0);
    
    // Move cursor to next row's input field
    setTimeout(() => {
      const nextMetric = getNextMetric(metric);
      if (nextMetric) {
        const nextInputId = getNextInputId(nextMetric, fromYear);
        const nextInput = document.getElementById(nextInputId);
        if (nextInput) {
          nextInput.focus();
        }
      }
    }, 100);
  };

  const getNextMetric = (currentMetric: keyof ProjectionInputs): string | null => {
    const metricOrder = ['revenueGrowth', 'netIncomeGrowth', 'peLow', 'peHigh'];
    const currentIndex = metricOrder.indexOf(currentMetric);
    
    if (currentIndex !== -1 && currentIndex < metricOrder.length - 1) {
      const nextMetric = metricOrder[currentIndex + 1];
      // Convert to the ID format used in the DOM
      switch (nextMetric) {
        case 'revenueGrowth': return 'revenue-growth';
        case 'netIncomeGrowth': return 'net-income-growth';
        case 'peLow': return 'pe-low';
        case 'peHigh': return 'pe-high';
        default: return null;
      }
    }
    return null;
  };

  const getNextInputId = (nextMetric: string, fromYear: string): string => {
    const isCurrentYear = fromYear === currentYear.toString();
    const isPeMetric = nextMetric === 'pe-low' || nextMetric === 'pe-high';
    
    // For PE metrics, start from current year (2025)
    // For growth metrics, start from first projection year (2026)
    if (isPeMetric) {
      return `${nextMetric}-${currentYear}`;
    } else {
      return `${nextMetric}-${projectionYears[0]}`;
    }
  };

  const handleInputFocus = (metric: string, year: string) => {
    const yearIndex = projectionYears.indexOf(year);
    const isCurrentYear = year === currentYear.toString();
    const isPeMetric = metric === 'pe-low' || metric === 'pe-high';
    
    // Show button for:
    // 1. Projection years 2026, 2027, 2028 (not 2029 since it's the last year)
    // 2. Current year (2025) for PE metrics only
    if ((yearIndex !== -1 && yearIndex < projectionYears.length - 1) || (isCurrentYear && isPeMetric)) {
      setShowForwardButton({ [`${metric}-${year}`]: true });
    }
  };

  const handleInputBlur = (metric: string, year: string) => {
    // Hide button after a delay, unless it's being hovered
    setTimeout(() => {
      setShowForwardButton(prev => ({ ...prev, [`${metric}-${year}`]: false }));
    }, 2000);
  };

  // Metric tooltip handlers
  const updateMetricTooltipPosition = () => {
    if (metricButtonRef.current) {
      const rect = metricButtonRef.current.getBoundingClientRect();
      setMetricTooltipCoords({
        top: rect.top - 8,
        left: rect.left + rect.width / 2
      });
    }
  };

  const handleMetricTooltipMouseEnter = () => {
    const timeout = setTimeout(() => {
      updateMetricTooltipPosition();
      setShowMetricTooltip(true);
    }, 250); // 250ms delay
    setHoverTimeout(timeout);
  };

  const handleMetricTooltipMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setShowMetricTooltip(false);
  };

  const handleMetricTooltipClick = () => {
    updateMetricTooltipPosition();
    setShowMetricTooltip(!showMetricTooltip);
  };

  const handleMetricTooltipKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleMetricTooltipClick();
    } else if (e.key === 'Escape') {
      setShowMetricTooltip(false);
    }
  };


  // Recalculate projections for active scenario
  const recalculateProjectionsForScenario = (inputs: ProjectionInputs) => {
    if (!projectionsState?.baseData?.revenue || !projectionsState?.baseData?.net_income) {
      return;
    }

    const newProjections: CalculatedProjections = {
      revenue: {},
      netIncome: {},
      netIncomeMargin: {},
      eps: {},
      sharePriceLow: {},
      sharePriceHigh: {},
      cagrLow: {},
      cagrHigh: {}
    };

    // Calculate current year share prices using current year PE ratios and current EPS
    const currentEPS = projectionsState?.baseData.eps || 0;
    const currentPeLow = inputs.peLow[currentYear] || 0;
    const currentPeHigh = inputs.peHigh[currentYear] || 0;
    newProjections.sharePriceLow[currentYear] = calculateStockPrice(currentEPS, currentPeLow);
    newProjections.sharePriceHigh[currentYear] = calculateStockPrice(currentEPS, currentPeHigh);

    // Start with current year values
    let previousRevenue = projectionsState?.baseData.revenue!;
    let previousNetIncome = projectionsState?.baseData.net_income!;

    // Calculate for each projection year
    projectionYears.forEach((year, index) => {
      const yearNum = parseInt(year);
      const yearsFromCurrent = index + 1;

      // 1. Calculate Revenue
      const revenueGrowth = inputs.revenueGrowth[year] || 0;
      const projectedRevenue = calculateProjectedRevenue(previousRevenue, revenueGrowth);
      newProjections.revenue[year] = projectedRevenue;

      // 2. Calculate Net Income from growth rate
      const netIncomeGrowth = inputs.netIncomeGrowth[year] || 0;
      const projectedNetIncome = netIncomeGrowth > 0 
        ? calculateNetIncomeFromGrowth(previousNetIncome, netIncomeGrowth)
        : 0;
      newProjections.netIncome[year] = projectedNetIncome;

      // 3. Calculate Net Income Margin
      const projectedNetIncomeMargin = calculateNetIncomeMargin(projectedNetIncome, projectedRevenue);
      newProjections.netIncomeMargin[year] = projectedNetIncomeMargin;

      // 4. Calculate EPS (net income / shares outstanding)
      // Get shares outstanding from stockInfo - this should be the actual shares for the current ticker
      const sharesOutstanding = stockInfo?.data?.shares_outstanding;
      let projectedEPS = 0;
      
      if (!sharesOutstanding) {
        console.error(`No shares outstanding data available for ${projectionsState?.baseData?.ticker}. StockInfo state:`, {
          hasData: !!stockInfo?.data,
          ticker: stockInfo?.data?.ticker,
          sharesOutstanding: stockInfo?.data?.shares_outstanding,
          loading: stockInfo?.loading,
          error: stockInfo?.error
        });
        // Use a fallback based on the ticker - this is a temporary fix
        const fallbackShares = projectionsState?.baseData?.ticker === 'GOOG' ? 5430000000 : 952000000;
        projectedEPS = calculateEPS(projectedNetIncome, fallbackShares);
      } else {
        projectedEPS = calculateEPS(projectedNetIncome, sharesOutstanding);
      }
      
      newProjections.eps[year] = projectedEPS;

      // 5. Calculate Stock Prices
      const peLow = inputs.peLow[year] || 0;
      const peHigh = inputs.peHigh[year] || 0;
      const priceLow = calculateStockPrice(projectedEPS, peLow);
      const priceHigh = calculateStockPrice(projectedEPS, peHigh);
      newProjections.sharePriceLow[year] = priceLow;
      newProjections.sharePriceHigh[year] = priceHigh;

      // 6. Calculate CAGR (start from year 2, which is index 1, so yearsFromCurrent >= 2)
      if (yearsFromCurrent >= 2) {
        const currentPrice = stockInfo?.data?.price || 0;
        if (currentPrice > 0) {
          const cagrLow = calculateCAGR(priceLow, currentPrice, yearsFromCurrent);
          const cagrHigh = calculateCAGR(priceHigh, currentPrice, yearsFromCurrent);
          newProjections.cagrLow[year] = cagrLow;
          newProjections.cagrHigh[year] = cagrHigh;
        } else {
          newProjections.cagrLow[year] = 0;
          newProjections.cagrHigh[year] = 0;
        }
      }

      // Update for next iteration
      previousRevenue = projectedRevenue;
      previousNetIncome = projectedNetIncome;
    });

    updateScenarioData({ calculatedProjections: newProjections });
  };

  // Legacy function for compatibility (now just calls scenario version)
  const recalculateProjections = (inputs: ProjectionInputs) => {
    recalculateProjectionsForScenario(inputs);
  };

  // Recalculate when base data changes
  useEffect(() => {
    if (projectionsState?.baseData?.revenue && projectionsState?.baseData?.net_income && projectionsState?.projectionInputs) {
      // Only recalculate if we have stockInfo for the same ticker, or if stockInfo is still loading
      const currentTicker = projectionsState.baseData.ticker;
      const stockInfoTicker = stockInfo?.data?.ticker;
      
      if (stockInfoTicker === currentTicker || stockInfo.loading) {
      recalculateProjections(projectionsState.projectionInputs);
      } else if (!stockInfo.loading && !stockInfoTicker) {
        // If stockInfo is not loading and we don't have data, try to fetch it
        actions.fetchStockInfo(currentTicker, authenticatedFetch).catch(console.error);
    }
    }
  }, [projectionsState?.baseData, projectionsState?.projectionInputs, stockInfo]);

  // Load data for global ticker on component mount and when it changes
  useEffect(() => {
    const tickerToLoad = globalTicker.currentTicker || 'AAPL';
    const needsProjectionsData = !projectionsState?.baseData || projectionsState.baseData.ticker !== tickerToLoad;
    const needsStockInfoData = !stockInfo?.data || stockInfo.data.ticker !== tickerToLoad;
    
    if (tickerToLoad && (needsProjectionsData || needsStockInfoData)) {
      const loadData = async () => {
        actions.setProjectionsLoading(true);
        actions.setProjectionsError(null);
        actions.setStockInfoLoading(true);
        
        try {
          // Fetch both projections and stock info concurrently
          const [projectionsPromise, stockInfoPromise] = await Promise.allSettled([
            // Check cache first for projections, then fetch if needed
            (async () => {
          const cachedData = actions.getCachedProjections(tickerToLoad);
              if (cachedData) return cachedData;
              return await actions.fetchProjections(tickerToLoad, authenticatedFetch);
            })(),
            // Fetch stock info (handles its own caching)
            actions.fetchStockInfo(tickerToLoad, authenticatedFetch)
          ]);
          
          // Handle projections result
          if (projectionsPromise.status === 'fulfilled') {
            actions.setProjectionsBaseData(projectionsPromise.value);
          } else {
            console.error("Error fetching projections:", projectionsPromise.reason);
            const errorMessage = projectionsPromise.reason instanceof Error ? projectionsPromise.reason.message : "Error fetching projections";
            actions.setProjectionsError(errorMessage);
            
            // If ticker not found, clear the projections data
            if (errorMessage.toLowerCase().includes('not found') || 
                errorMessage.toLowerCase().includes('404') ||
                errorMessage.toLowerCase().includes('does not exist') ||
                errorMessage.toLowerCase().includes('failed to fetch data for')) {
              actions.setProjectionsBaseData({
                ticker: tickerToLoad,
                revenue: 0,
                net_income: 0,
                eps: 0,
                net_income_margin: 0,
                data_year: new Date().getFullYear()
              });
            }
          }
          
          // Stock info is automatically handled by the fetchStockInfo action
          if (stockInfoPromise.status === 'rejected') {
            console.error("Error fetching stock info:", stockInfoPromise.reason);
            actions.setStockInfoError(stockInfoPromise.reason instanceof Error ? stockInfoPromise.reason.message : "Error fetching stock info");
          }
          
          // Clear all user inputs when switching to a new ticker
          const clearedInputs = {
            revenueGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
            netIncomeGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
            peLow: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
            peHigh: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 }
          };
          actions.setProjectionsInputs(clearedInputs);
          
          // Clear calculated projections
          actions.setCalculatedProjections({
            revenue: {},
            netIncome: {},
            netIncomeMargin: {},
            eps: {},
            sharePriceLow: {},
            sharePriceHigh: {},
            cagrLow: {},
            cagrHigh: {}
          });
          
        } catch (err) {
          console.error(`Error loading ${tickerToLoad} data:`, err);
          actions.setProjectionsError(err instanceof Error ? err.message : `Failed to load ${tickerToLoad} data`);
          actions.setStockInfoError(err instanceof Error ? err.message : `Failed to load ${tickerToLoad} stock info`);
        } finally {
          actions.setProjectionsLoading(false);
          actions.setStockInfoLoading(false);
        }
      };
      
      loadData();
    }
  }, [globalTicker.currentTicker]); // Depend on global ticker changes

  // Sync input field when global ticker changes from other pages
  useEffect(() => {
    if (globalTicker.currentTicker && globalTicker.currentTicker !== stockSymbol) {
      setStockSymbol(globalTicker.currentTicker);
    }
  }, [globalTicker.currentTicker]);

  // Restore cached scenario projections when component loads or ticker changes
  useEffect(() => {
    if (stockSymbol && projectionsState?.baseData?.ticker === stockSymbol) {
      const cachedScenarioData = actions.getCachedScenarioProjections(stockSymbol);
      if (cachedScenarioData) {
        console.log(`🔄 Restoring cached scenario projections for ${stockSymbol}:`, cachedScenarioData);
        setScenarioData({
          base: cachedScenarioData.base,
          bull: cachedScenarioData.bull,
          bear: cachedScenarioData.bear
        });
        setActiveScenario(cachedScenarioData.activeScenario);
      } else {
        console.log(`📝 No cached data found for ${stockSymbol}, using fresh state`);
      }
      // Mark initial load as complete
      setIsInitialLoad(false);
    }
  }, [stockSymbol, projectionsState?.baseData?.ticker, actions]);

  // Save scenario data to cache whenever it changes (but not during initial load)
  useEffect(() => {
    if (!isInitialLoad && stockSymbol && projectionsState?.baseData?.ticker === stockSymbol && scenarioData) {
      console.log(`💾 Saving scenario projections to cache for ${stockSymbol}:`, { scenarioData, activeScenario });
      actions.setCachedScenarioProjections(stockSymbol, {
        ...scenarioData,
        activeScenario
      });
    }
  }, [scenarioData, activeScenario, stockSymbol, projectionsState?.baseData?.ticker, actions, isInitialLoad]);

  return (
    <AppLayout user={loaderData.user}>
      <style dangerouslySetInnerHTML={{ __html: cursorStyles }} />
      <main className="min-h-screen bg-page-background">
        <div className="container mx-auto px-6 py-8">
          <div className="w-full max-w-6xl mx-auto">
            
            <StockSearchHeader
              stockSymbol={stockSymbol}
              onStockSymbolChange={handleTickerChange}
              onSearch={performSearch}
              loading={projectionsState?.loading || stockInfo.loading || false}
              ticker={stockInfo.data?.ticker || stockSymbol}
              stockPrice={stockInfo.data?.price}
              marketCap={stockInfo.data?.market_cap}
              sharesOutstanding={stockInfo.data?.shares_outstanding}
              showSharesOutstanding={true}
              formatCurrency={formatCurrency}
              formatNumber={formatNumber}
              error={stockInfo.error}
            />

            {/* Scenario Tabs */}
            <div className="mt-8 mb-6">
              {/* Desktop Tabs */}
              <div className="hidden md:block">
                <div className="border-b border-gray-200">
                  <div className="flex justify-between items-end">
                    <nav className="-mb-px flex space-x-2">
                      {[
                        { key: 'bear', label: 'Bear Case' },
                        { key: 'base', label: 'Base Case' },
                        { key: 'bull', label: 'Bull Case' }
                      ].map((scenario) => (
                        <button
                          key={scenario.key}
                          onClick={() => handleScenarioChange(scenario.key as ScenarioType)}
                          className={`px-6 py-3 text-sm font-medium rounded-t-lg border-b-3 transition-colors cursor-pointer hover:cursor-pointer active:cursor-pointer ${
                            activeScenario === scenario.key
                              ? 'text-white font-semibold border-transparent'
                              : 'bg-transparent text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50 hover:cursor-pointer'
                          }`}
                          style={activeScenario === scenario.key ? (
                            scenario.key === 'base' 
                              ? { backgroundColor: 'var(--base-case-color)', borderBottomColor: 'transparent' }
                              : scenario.key === 'bull'
                              ? { backgroundColor: 'var(--bull-color)', borderBottomColor: 'transparent' }
                              : { backgroundColor: 'var(--bear-color)', borderBottomColor: 'transparent' }
                          ) : {}}
                        >
                          <span>{scenario.label}</span>
                        </button>
                      ))}
                    </nav>
                    
                    {/* Reset All Button */}
                    <Button
                      onClick={handleResetAllProjections}
                      variant="outline"
                      className="cursor-pointer mb-3 bg-transparent border-gray-300 text-gray-500 px-6 py-3 rounded-md text-sm font-medium hover:text-red-500 hover:border-red-300 hover:bg-red-50 hover:cursor-pointer active:bg-red-100 active:cursor-pointer focus:outline-none focus:ring-0 focus:border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-200"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset All
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile Dropdown */}
              <div className="md:hidden">
                <div className="flex justify-between items-end mb-2">
                  <label htmlFor="scenario-select" className="block text-sm font-medium text-gray-700">
                    Scenario
                  </label>
                  <Button 
                    onClick={handleResetAllProjections}
                    variant="outline"
                    size="sm"
                    className="cursor-pointer bg-transparent border-gray-300 text-gray-500 px-3 py-1 rounded-md text-xs font-medium hover:text-red-500 hover:border-red-300 hover:bg-red-50 hover:cursor-pointer active:bg-red-100 active:cursor-pointer focus:outline-none focus:ring-0 focus:border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-200"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset All
                  </Button>
                </div>
                <select
                  id="scenario-select"
                  value={activeScenario}
                  onChange={(e) => handleScenarioChange(e.target.value as ScenarioType)}
                  className="cursor-pointer block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 hover:cursor-pointer"
                >
                  <option value="bear">Bear Case</option>
                  <option value="base">Base Case</option>
                  <option value="bull">Bull Case</option>
                </select>
              </div>
            </div>

            {/* Error State - Only show non-404 errors */}
            {((projectionsState?.error && !(
              projectionsState.error.toLowerCase().includes('not found') || 
              projectionsState.error.toLowerCase().includes('404') ||
              projectionsState.error.toLowerCase().includes('does not exist') ||
              projectionsState.error.toLowerCase().includes('failed to fetch data for')
            )) || (stockInfo.error && !(
              stockInfo.error.toLowerCase().includes('not found') || 
              stockInfo.error.toLowerCase().includes('404') ||
              stockInfo.error.toLowerCase().includes('does not exist')
            ))) && (
              <Card>
                <CardContent>
                  <div className="text-red-600 text-center bg-red-50 p-3 rounded-md border border-red-200">
                    {projectionsState?.error && !(
                      projectionsState.error.toLowerCase().includes('not found') || 
                      projectionsState.error.toLowerCase().includes('404') ||
                      projectionsState.error.toLowerCase().includes('does not exist') ||
                      projectionsState.error.toLowerCase().includes('failed to fetch data for')
                    ) && <div>{projectionsState.error}</div>}
                    {stockInfo.error && !(
                      stockInfo.error.toLowerCase().includes('not found') || 
                      stockInfo.error.toLowerCase().includes('404') ||
                      stockInfo.error.toLowerCase().includes('does not exist')
                    ) && <div>{stockInfo.error}</div>}
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Combined Financial Data Table with Grouped Spacing */}
            <Card>
              <CardContent>
                <div id="projections-financial-data-table">
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead>
                        <tr id="financial-data-year-headers" className="border-b">
                          <th id="financial-metric-column" className="py-3 px-4 text-left font-bold text-gray-900 text-sm uppercase tracking-wider w-[200px]">
                            <div className="inline-flex items-center gap-1.5">
                              <span>METRIC</span>
                              <button
                                ref={metricButtonRef}
                                onClick={handleMetricTooltipClick}
                                onKeyDown={handleMetricTooltipKeyDown}
                                onMouseEnter={handleMetricTooltipMouseEnter}
                                onMouseLeave={handleMetricTooltipMouseLeave}
                                className="inline-flex items-center justify-center w-4 h-4 text-gray-500 opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                                aria-label="Information about data periods"
                                aria-describedby="metric-tooltip"
                                tabIndex={0}
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            </div>
                          </th>
                          {showMetricTooltip && typeof document !== 'undefined' && createPortal(
                            <div
                              id="metric-tooltip"
                              className="fixed z-[9999] bg-gray-800 text-white text-xs px-4 py-3 rounded-md shadow-lg pointer-events-none"
                              role="tooltip"
                              aria-live="polite"
                              style={{
                                top: `${metricTooltipCoords.top}px`,
                                left: `${metricTooltipCoords.left}px`,
                                transform: 'translate(-50%, -100%)',
                                opacity: showMetricTooltip ? 1 : 0,
                                transition: 'opacity 200ms ease-in-out',
                                maxWidth: '340px',
                                lineHeight: '1.5'
                              }}
                            >
                              <p>{currentYear} figures combine actual results with estimates</p>
                              <div 
                                className="absolute left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"
                                style={{
                                  top: '100%',
                                  marginTop: '-4px'
                                }}
                              ></div>
                            </div>,
                            document.body
                          )}
                          <th id={`year-${currentYear}-column`} className="py-3 px-4 text-right font-bold text-sm w-[120px] align-top">
                            <div className="inline-flex flex-col items-center ml-auto">
                              <span className="font-bold text-blue-600">{currentYear}</span>
                              <span className="text-xs text-blue-600 font-semibold">EST</span>
                            </div>
                          </th>
                          <th id={`year-${projectionYears[0]}-column`} className="py-3 px-4 text-right font-bold text-sm w-[120px] align-top">
                            <div className="inline-flex flex-col items-center ml-auto">
                              <span className="font-bold text-blue-600">{projectionYears[0]}</span>
                              <span className="text-xs text-blue-600 font-semibold">EST</span>
                            </div>
                          </th>
                          <th id={`year-${projectionYears[1]}-column`} className="py-3 px-4 text-right font-bold text-sm w-[120px] align-top">
                            <div className="inline-flex flex-col items-center ml-auto">
                              <span className="font-bold text-blue-600">{projectionYears[1]}</span>
                              <span className="text-xs text-blue-600 font-semibold">EST</span>
                            </div>
                          </th>
                          <th id={`year-${projectionYears[2]}-column`} className="py-3 px-4 text-right font-bold text-sm w-[120px] align-top">
                            <div className="inline-flex flex-col items-center ml-auto">
                              <span className="font-bold text-blue-600">{projectionYears[2]}</span>
                              <span className="text-xs text-blue-600 font-semibold">EST</span>
                            </div>
                          </th>
                          <th id={`year-${projectionYears[3]}-column`} className="py-3 px-4 text-right font-bold text-sm w-[120px] align-top">
                            <div className="inline-flex flex-col items-center ml-auto">
                              <span className="font-bold text-blue-600">{projectionYears[3]}</span>
                              <span className="text-xs text-blue-600 font-semibold">EST</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody id="financial-data-rows">
                        {/* Revenue Section */}
                        <tr id="revenue-data-row" className="border-b border-gray-100">
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm w-[200px]">Revenue</td>
                          <td id={`revenue-${currentYear}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm w-[120px]">{formatCurrency(projectionsState.baseData?.revenue)}</td>
                          <td id={`revenue-${projectionYears[0]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm w-[120px]">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.revenue[projectionYears[0]])}</td>
                          <td id={`revenue-${projectionYears[1]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm w-[120px]">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.revenue[projectionYears[1]])}</td>
                          <td id={`revenue-${projectionYears[2]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm w-[120px]">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.revenue[projectionYears[2]])}</td>
                          <td id={`revenue-${projectionYears[3]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm w-[120px]">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.revenue[projectionYears[3]])}</td>
                        </tr>
                        <tr id="revenue-growth-input-row" className="border-b border-gray-100" style={{borderBottom: '4px solid #e5e7eb'}}>
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm w-[200px]">Revenue Growth</td>
                          <td className="py-2 px-4 text-right w-[120px]"></td>
                          {projectionYears.map((year, index) => (
                            <td key={year} className="py-2 px-4 text-right w-[120px] relative overflow-visible">
                              <div className="relative w-16 ml-auto">
                              <Input
                                id={`revenue-growth-${year}`}
                                type="text"
                                  autoComplete="off"
                                  value={formatPercentageInput(getActiveScenarioData()?.projectionInputs?.revenueGrowth[year])}
                                onChange={(e) => {
                                  const cleanValue = e.target.value.replace('%', '');
                                  handlePercentageInputChange('revenueGrowth', year, cleanValue);
                                }}
                                  onFocus={() => handleInputFocus('revenue-growth', year)}
                                  onBlur={() => handleInputBlur('revenue-growth', year)}
                                onKeyDown={(e) => handleKeyDown(e, 'revenue-growth', year)}
                                  className={`bg-transparent border-0 border-b-2 border-gray-300 rounded-none shadow-none outline-none focus:ring-0 focus-visible:ring-0 focus:border-blue-500 text-right px-0 h-8 w-full ${appliedCells[`revenueGrowth-${year}`] ? '!border-blue-500' : ''}`}
                                style={{...inputStyle, textAlign: 'right'}}
                                placeholder="0%"
                              />
                              {showForwardButton[`revenue-growth-${year}`] && index < projectionYears.length - 1 && (
                                <button
                                  onClick={() => handleForwardApply('revenueGrowth', year)}
                                  onMouseEnter={() => setShowForwardButton(prev => ({ ...prev, [`revenue-growth-${year}`]: true }))}
                                  className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-transparent hover:bg-blue-50 rounded text-blue-600 hover:text-blue-700 flex items-center justify-center cursor-pointer p-1 z-10"
                                  title="Apply to all future years"
                                >
                                  →
                                </button>
                              )}
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Net Income Section */}
                        <tr id="net-income-data-row" className="border-b border-gray-100">
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm w-[200px]">Net Income</td>
                          <td id={`net-income-${currentYear}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm w-[120px]">{formatCurrency(projectionsState.baseData?.net_income)}</td>
                          <td id={`net-income-${projectionYears[0]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm w-[120px]">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.netIncome[projectionYears[0]])}</td>
                          <td id={`net-income-${projectionYears[1]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm w-[120px]">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.netIncome[projectionYears[1]])}</td>
                          <td id={`net-income-${projectionYears[2]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm w-[120px]">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.netIncome[projectionYears[2]])}</td>
                          <td id={`net-income-${projectionYears[3]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm w-[120px]">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.netIncome[projectionYears[3]])}</td>
                        </tr>
                        <tr id="net-income-growth-input-row" className="border-b border-gray-100" style={{borderBottom: '4px solid #e5e7eb'}}>
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm">Net Inc Growth</td>
                          <td className="py-2 px-4 text-right"></td>
                          {projectionYears.map((year, index) => (
                            <td key={year} className="py-2 px-4 text-right w-[120px] relative overflow-visible">
                              <div className="relative w-16 ml-auto">
                              <Input
                                id={`net-income-growth-${year}`}
                                type="text"
                                  autoComplete="off"
                                  value={formatPercentageInput(getActiveScenarioData()?.projectionInputs?.netIncomeGrowth[year])}
                                onChange={(e) => {
                                  const cleanValue = e.target.value.replace('%', '');
                                  handlePercentageInputChange('netIncomeGrowth', year, cleanValue);
                                }}
                                  onFocus={() => handleInputFocus('net-income-growth', year)}
                                  onBlur={() => handleInputBlur('net-income-growth', year)}
                                onKeyDown={(e) => handleKeyDown(e, 'net-income-growth', year)}
                                  className={`bg-transparent border-0 border-b-2 border-gray-300 rounded-none shadow-none outline-none focus:ring-0 focus-visible:ring-0 focus:border-blue-500 text-right px-0 h-8 w-full ${appliedCells[`netIncomeGrowth-${year}`] ? '!border-blue-500' : ''}`}
                                style={{...inputStyle, textAlign: 'right'}}
                                placeholder="0%"
                              />
                              {showForwardButton[`net-income-growth-${year}`] && index < projectionYears.length - 1 && (
                                <button
                                  onClick={() => handleForwardApply('netIncomeGrowth', year)}
                                  onMouseEnter={() => setShowForwardButton(prev => ({ ...prev, [`net-income-growth-${year}`]: true }))}
                                  className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-transparent hover:bg-blue-50 rounded text-blue-600 hover:text-blue-700 flex items-center justify-center cursor-pointer p-1 z-10"
                                  title="Apply to all future years"
                                >
                                  →
                                </button>
                              )}
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Net Income Margins Section - Calculated Field */}
                        <tr id="net-income-margin-row" className="bg-gray-50" style={{borderBottom: '4px solid #e5e7eb'}}>
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm">Net Inc Margins</td>
                          <td className="py-2 px-4 text-right font-medium text-gray-900 text-sm">{formatMarginPercentage(projectionsState.baseData?.net_income_margin)}</td>
                          <td className="py-2 px-4 text-right font-medium text-gray-900 text-sm">{formatMarginPercentage(getActiveScenarioData()?.calculatedProjections?.netIncomeMargin[projectionYears[0]])}</td>
                          <td className="py-2 px-4 text-right font-medium text-gray-900 text-sm">{formatMarginPercentage(getActiveScenarioData()?.calculatedProjections?.netIncomeMargin[projectionYears[1]])}</td>
                          <td className="py-2 px-4 text-right font-medium text-gray-900 text-sm">{formatMarginPercentage(getActiveScenarioData()?.calculatedProjections?.netIncomeMargin[projectionYears[2]])}</td>
                          <td className="py-2 px-4 text-right font-medium text-gray-900 text-sm">{formatMarginPercentage(getActiveScenarioData()?.calculatedProjections?.netIncomeMargin[projectionYears[3]])}</td>
                        </tr>

                        {/* EPS Section */}
                        <tr id="eps-data-row" className="border-b bg-gray-50" style={{borderBottom: '4px solid #e5e7eb'}}>
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm">EPS</td>
                          <td id={`eps-${currentYear}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm">{formatCurrency(projectionsState.baseData?.eps)}</td>
                          <td id={`eps-${projectionYears[0]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.eps[projectionYears[0]])}</td>
                          <td id={`eps-${projectionYears[1]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.eps[projectionYears[1]])}</td>
                          <td id={`eps-${projectionYears[2]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.eps[projectionYears[2]])}</td>
                          <td id={`eps-${projectionYears[3]}`} className="py-2 px-4 text-right font-medium text-gray-900 text-sm">{formatCurrency(getActiveScenarioData()?.calculatedProjections?.eps[projectionYears[3]])}</td>
                        </tr>
                        <tr id="pe-low-input-row" className="border-b bg-white">
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm">PE Low Est</td>
                          <td className="py-2 px-4 text-right relative w-[120px] overflow-visible">
                            <div className="relative w-16 ml-auto">
                            <Input
                              id={`pe-low-${currentYear}`}
                              type="text"
                                autoComplete="off"
                                value={getActiveScenarioData()?.projectionInputs?.peLow[currentYear] || ''}
                              onChange={(e) => handleProjectionInputChange('peLow', currentYear.toString(), parseFloat(e.target.value) || 0)}
                                onFocus={() => handleInputFocus('pe-low', currentYear.toString())}
                                onBlur={() => handleInputBlur('pe-low', currentYear.toString())}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const nextInput = document.getElementById(`pe-low-${projectionYears[0]}`);
                                  if (nextInput) nextInput.focus();
                                }
                              }}
                                className={`bg-transparent border-0 border-b-2 border-gray-300 rounded-none shadow-none outline-none focus:ring-0 focus-visible:ring-0 focus:border-blue-500 text-right px-0 h-8 w-full ${appliedCells[`peLow-${currentYear}`] ? '!border-blue-500' : ''}`}
                              style={{...inputStyle, textAlign: 'right'}}
                              placeholder="0"
                            />
                            {showForwardButton[`pe-low-${currentYear}`] && (
                              <button
                                onClick={() => handleForwardApply('peLow', currentYear.toString())}
                                onMouseEnter={() => setShowForwardButton(prev => ({ ...prev, [`pe-low-${currentYear}`]: true }))}
                                className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-6 bg-transparent hover:bg-blue-50 rounded text-blue-600 hover:text-blue-700 flex items-center justify-center cursor-pointer p-1 z-10"
                                title="Apply to all future years"
                              >
                                →
                              </button>
                            )}
                            </div>
                          </td>
                          {projectionYears.map((year, index) => (
                            <td key={year} className="py-2 px-4 text-right w-[120px] relative overflow-visible">
                              <div className="relative w-16 ml-auto">
                              <Input
                                id={`pe-low-${year}`}
                                type="text"
                                  autoComplete="off"
                                  value={getActiveScenarioData()?.projectionInputs?.peLow[year] || ''}
                                onChange={(e) => handleProjectionInputChange('peLow', year, parseFloat(e.target.value) || 0)}
                                  onFocus={() => handleInputFocus('pe-low', year)}
                                  onBlur={() => handleInputBlur('pe-low', year)}
                                onKeyDown={(e) => handleKeyDown(e, 'pe-low', year)}
                                  className={`bg-transparent border-0 border-b-2 border-gray-300 rounded-none shadow-none outline-none focus:ring-0 focus-visible:ring-0 focus:border-blue-500 text-right px-0 h-8 w-full ${appliedCells[`peLow-${year}`] ? '!border-blue-500' : ''}`}
                                style={{...inputStyle, textAlign: 'right'}}
                                placeholder="0"
                              />
                              {showForwardButton[`pe-low-${year}`] && index < projectionYears.length - 1 && (
                                <button
                                  onClick={() => handleForwardApply('peLow', year)}
                                  onMouseEnter={() => setShowForwardButton(prev => ({ ...prev, [`pe-low-${year}`]: true }))}
                                  className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-transparent hover:bg-blue-50 rounded text-blue-600 hover:text-blue-700 flex items-center justify-center cursor-pointer p-1 z-10"
                                  title="Apply to all future years"
                                >
                                  →
                                </button>
                              )}
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr id="pe-high-input-row" className="bg-white" style={{borderBottom: '4px solid #e5e7eb'}}>
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm">PE High Est</td>
                          <td className="py-2 px-4 text-right relative w-[120px] overflow-visible">
                            <div className="relative w-16 ml-auto">
                            <Input
                              id={`pe-high-${currentYear}`}
                              type="text"
                                autoComplete="off"
                                value={getActiveScenarioData()?.projectionInputs?.peHigh[currentYear] || ''}
                              onChange={(e) => handleProjectionInputChange('peHigh', currentYear.toString(), parseFloat(e.target.value) || 0)}
                                onFocus={() => handleInputFocus('pe-high', currentYear.toString())}
                                onBlur={() => handleInputBlur('pe-high', currentYear.toString())}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const nextInput = document.getElementById(`pe-high-${projectionYears[0]}`);
                                  if (nextInput) nextInput.focus();
                                }
                              }}
                                className={`bg-transparent border-0 border-b-2 border-gray-300 rounded-none shadow-none outline-none focus:ring-0 focus-visible:ring-0 focus:border-blue-500 text-right px-0 h-8 w-full ${appliedCells[`peHigh-${currentYear}`] ? '!border-blue-500' : ''}`}
                              style={{...inputStyle, textAlign: 'right'}}
                              placeholder="0"
                            />
                            {showForwardButton[`pe-high-${currentYear}`] && (
                              <button
                                onClick={() => handleForwardApply('peHigh', currentYear.toString())}
                                onMouseEnter={() => setShowForwardButton(prev => ({ ...prev, [`pe-high-${currentYear}`]: true }))}
                                className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-transparent hover:bg-blue-50 rounded text-blue-600 hover:text-blue-700 flex items-center justify-center cursor-pointer p-1 z-10"
                                title="Apply to all future years"
                              >
                                →
                              </button>
                            )}
                            </div>
                          </td>
                          {projectionYears.map((year, index) => (
                            <td key={year} className="py-2 px-4 text-right w-[120px] relative overflow-visible">
                              <div className="relative w-16 ml-auto">
                              <Input
                                id={`pe-high-${year}`}
                                type="text"
                                  autoComplete="off"
                                  value={getActiveScenarioData()?.projectionInputs?.peHigh[year] || ''}
                                onChange={(e) => handleProjectionInputChange('peHigh', year, parseFloat(e.target.value) || 0)}
                                  onFocus={() => handleInputFocus('pe-high', year)}
                                  onBlur={() => handleInputBlur('pe-high', year)}
                                onKeyDown={(e) => handleKeyDown(e, 'pe-high', year)}
                                  className={`bg-transparent border-0 border-b-2 border-gray-300 rounded-none shadow-none outline-none focus:ring-0 focus-visible:ring-0 focus:border-blue-500 text-right px-0 h-8 w-full ${appliedCells[`peHigh-${year}`] ? '!border-blue-500' : ''}`}
                                style={{...inputStyle, textAlign: 'right'}}
                                placeholder="0"
                              />
                              {showForwardButton[`pe-high-${year}`] && index < projectionYears.length - 1 && (
                                <button
                                  onClick={() => handleForwardApply('peHigh', year)}
                                  onMouseEnter={() => setShowForwardButton(prev => ({ ...prev, [`pe-high-${year}`]: true }))}
                                  className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-transparent hover:bg-blue-50 rounded text-blue-600 hover:text-blue-700 flex items-center justify-center cursor-pointer p-1 z-10"
                                  title="Apply to all future years"
                                >
                                  →
                                </button>
                              )}
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Share Price Section */}
                        <tr id="share-price-low-data-row" className="border-b bg-gray-50">
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm">Share Price Low</td>
                          <td id={`share-price-low-${currentYear}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedCurrency(getActiveScenarioData()?.calculatedProjections?.sharePriceLow[currentYear])}</td>
                          <td id={`share-price-low-${projectionYears[0]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedCurrency(getActiveScenarioData()?.calculatedProjections?.sharePriceLow[projectionYears[0]])}</td>
                          <td id={`share-price-low-${projectionYears[1]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedCurrency(getActiveScenarioData()?.calculatedProjections?.sharePriceLow[projectionYears[1]])}</td>
                          <td id={`share-price-low-${projectionYears[2]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedCurrency(getActiveScenarioData()?.calculatedProjections?.sharePriceLow[projectionYears[2]])}</td>
                          <td id={`share-price-low-${projectionYears[3]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedCurrency(getActiveScenarioData()?.calculatedProjections?.sharePriceLow[projectionYears[3]])}</td>
                        </tr>
                        <tr id="share-price-high-data-row" className="bg-gray-50" style={{borderBottom: '4px solid #e5e7eb'}}>
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm">Share Price High</td>
                          <td id={`share-price-high-${currentYear}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedCurrency(getActiveScenarioData()?.calculatedProjections?.sharePriceHigh[currentYear])}</td>
                          <td id={`share-price-high-${projectionYears[0]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedCurrency(getActiveScenarioData()?.calculatedProjections?.sharePriceHigh[projectionYears[0]])}</td>
                          <td id={`share-price-high-${projectionYears[1]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedCurrency(getActiveScenarioData()?.calculatedProjections?.sharePriceHigh[projectionYears[1]])}</td>
                          <td id={`share-price-high-${projectionYears[2]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedCurrency(getActiveScenarioData()?.calculatedProjections?.sharePriceHigh[projectionYears[2]])}</td>
                          <td id={`share-price-high-${projectionYears[3]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedCurrency(getActiveScenarioData()?.calculatedProjections?.sharePriceHigh[projectionYears[3]])}</td>
                        </tr>

                        {/* CAGR Section */}
                        <tr id="cagr-low-data-row" className="border-b bg-gray-50">
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm">CAGR Low</td>
                          <td id={`cagr-low-${currentYear}`} className="py-2 px-4 text-center"></td>
                          <td id={`cagr-low-${projectionYears[0]}`} className="py-2 px-4 text-center"></td>
                          <td id={`cagr-low-${projectionYears[1]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedPercentage(getActiveScenarioData()?.calculatedProjections?.cagrLow[projectionYears[1]])}</td>
                          <td id={`cagr-low-${projectionYears[2]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedPercentage(getActiveScenarioData()?.calculatedProjections?.cagrLow[projectionYears[2]])}</td>
                          <td id={`cagr-low-${projectionYears[3]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedPercentage(getActiveScenarioData()?.calculatedProjections?.cagrLow[projectionYears[3]])}</td>
                        </tr>
                        <tr id="cagr-high-data-row" className="bg-gray-50">
                          <td className="py-2 px-4 font-semibold text-gray-900 text-sm">CAGR High</td>
                          <td id={`cagr-high-${currentYear}`} className="py-2 px-4 text-center"></td>
                          <td id={`cagr-high-${projectionYears[0]}`} className="py-2 px-4 text-center"></td>
                          <td id={`cagr-high-${projectionYears[1]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedPercentage(getActiveScenarioData()?.calculatedProjections?.cagrHigh[projectionYears[1]])}</td>
                          <td id={`cagr-high-${projectionYears[2]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedPercentage(getActiveScenarioData()?.calculatedProjections?.cagrHigh[projectionYears[2]])}</td>
                          <td id={`cagr-high-${projectionYears[3]}`} className="py-2 px-4 text-right bg-orange-100 font-medium text-gray-900 text-sm">{formatRoundedPercentage(getActiveScenarioData()?.calculatedProjections?.cagrHigh[projectionYears[3]])}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </main>
    </AppLayout>
  );
}