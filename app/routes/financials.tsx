import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { AppLayout } from "~/components/app-layout";
import { StockSearchHeader } from "~/components/stock-search-header";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { useFinancialsState, useStockActions, useGlobalTicker, useStockInfo } from "~/store/stockStore";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { useSubscriptionCheck } from "~/hooks/useSubscriptionCheck";
import { getAuth } from "@clerk/react-router/ssr.server";
import { createClerkClient } from "@clerk/react-router/api.server";
import { redirect } from "react-router";
import { Info } from "lucide-react";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/financials";
import { BRAND_NAME } from "~/config/brand";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Financial Statements - ${BRAND_NAME}` },
    { name: "description", content: "View detailed financial statements and ratios" },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const { protectedRouteLoader } = await import("~/lib/routeProtection");
  return protectedRouteLoader(args);
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
  price: number;
  market_cap: number;
  historical: HistoricalData[];
  estimates: EstimateData[];
}

// Color configuration - uses CSS variables defined in app.css
const GROWTH_COLORS = {
  positive: "text-bull",  // Uses --bull-color from app.css (#15803d)
  negative: "text-bear",  // Uses --bear-color from app.css (#b91c1c)
  fontWeight: "font-medium",
};
// Utility functions as per documentation
// Helper function to format number - only remove .00 for 0 and 100
const formatNumberValue = (num: number): string => {
  const rounded = parseFloat(num.toFixed(2));
  // Only remove .00 for exactly 0 or 100
  if (rounded === 0 || rounded === 100) {
    return rounded.toString();
  }
  return num.toFixed(2);
};

const formatLargeNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "";
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1e12) {
    return `$${formatNumberValue(value / 1e12)}T`;
  } else if (absValue >= 1e9) {
    return `$${formatNumberValue(value / 1e9)}B`;
  } else if (absValue >= 1e6) {
    // For millions, use toFixed(0) then remove trailing zeros (though there won't be any)
    const millions = value / 1e6;
    return `$${parseFloat(millions.toFixed(0)).toString()}M`;
  } else if (absValue >= 1e3) {
    return `$${formatNumberValue(value / 1e3)}K`;
  }
  return `$${formatNumberValue(value)}`;
};

const formatEPS = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "";
  return `$${formatNumberValue(value)}`;
};

const formatRAndD = (value: number | null | undefined, isEstimateYear: boolean): string => {
  if (value === null || value === undefined) {
    return isEstimateYear ? "" : "N/A";
  }
  if (isNaN(value)) return "";
  const absValue = Math.abs(value);
  if (absValue >= 1e12) {
    return `$${formatNumberValue(value / 1e12)}T`;
  } else if (absValue >= 1e9) {
    return `$${formatNumberValue(value / 1e9)}B`;
  } else if (absValue >= 1e6) {
    // For millions, use toFixed(0) then remove trailing zeros (though there won't be any)
    const millions = value / 1e6;
    return `$${parseFloat(millions.toFixed(0)).toString()}M`;
  } else if (absValue >= 1e3) {
    return `$${formatNumberValue(value / 1e3)}K`;
  }
  return `$${formatNumberValue(value)}`;
};

const formatSGAAndOpEx = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "N/A";
  }
  if (isNaN(value)) return "";
  const absValue = Math.abs(value);
  if (absValue >= 1e12) {
    return `$${formatNumberValue(value / 1e12)}T`;
  } else if (absValue >= 1e9) {
    return `$${formatNumberValue(value / 1e9)}B`;
  } else if (absValue >= 1e6) {
    const millions = value / 1e6;
    return `$${parseFloat(millions.toFixed(0)).toString()}M`;
  } else if (absValue >= 1e3) {
    return `$${formatNumberValue(value / 1e3)}K`;
  }
  return `$${formatNumberValue(value)}`;
};

const formatCostOfRevenue = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "$0";
  }
  const absValue = Math.abs(value);
  if (absValue >= 1e12) {
    return `$${formatNumberValue(value / 1e12)}T`;
  } else if (absValue >= 1e9) {
    return `$${formatNumberValue(value / 1e9)}B`;
  } else if (absValue >= 1e6) {
    const millions = value / 1e6;
    return `$${parseFloat(millions.toFixed(0)).toString()}M`;
  } else if (absValue >= 1e3) {
    return `$${formatNumberValue(value / 1e3)}K`;
  }
  return `$${formatNumberValue(value)}`;
};

const formatOperatingIncome = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "$0";
  }
  const absValue = Math.abs(value);
  if (absValue >= 1e12) {
    return `$${formatNumberValue(value / 1e12)}T`;
  } else if (absValue >= 1e9) {
    return `$${formatNumberValue(value / 1e9)}B`;
  } else if (absValue >= 1e6) {
    const millions = value / 1e6;
    return `$${parseFloat(millions.toFixed(0)).toString()}M`;
  } else if (absValue >= 1e3) {
    return `$${formatNumberValue(value / 1e3)}K`;
  }
  return `$${formatNumberValue(value)}`;
};

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return value.toLocaleString();
};

const calculateYoYGrowth = (current: number | null, previous: number | null): { text: string; isPositive: boolean } | null => {
  if (!current || !previous || previous === 0) return null;
  const growth = ((current - previous) / Math.abs(previous)) * 100;
  const isPositive = growth >= 0;
  const absGrowth = Math.abs(growth);
  const rounded = parseFloat(absGrowth.toFixed(1));
  // Only remove .0 for exactly 0 or 100
  const formattedGrowth = (rounded === 0 || rounded === 100) ? rounded.toString() : absGrowth.toFixed(1);
  return {
    text: isPositive ? `+${formattedGrowth}%` : `-${formattedGrowth}%`,
    isPositive
  };
};

interface MetricRowProps {
  metricName: string;
  data: FinancialsData | null;
  allYears: string[];
  estimateYears: string[];
  getHistoricalValue: (year: string) => number | null;
  getEstimateValue: (year: string) => number | null;
  formatter: (value: number | null) => string;
}

const MetricRow = ({ metricName, data, allYears, estimateYears, getHistoricalValue, getEstimateValue, formatter }: MetricRowProps) => {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-1.5 pl-3 pr-0 font-semibold text-gray-900 text-sm w-[200px] text-left">{metricName}</td>
      {allYears.map((year, index) => {
        const historical = data?.historical?.find(h => h.fiscalYear === year);
        const estimate = data?.estimates?.find(e => e.fiscalYear === year);
        const isEstimateYear = estimateYears.includes(year);
        const value = getHistoricalValue(year) ?? getEstimateValue(year);
        
        // Special handling for metrics with custom null display logic
        let displayValue: string;
        if (metricName === "R&D" && isEstimateYear && value === null) {
          // For R&D metric, if it's an estimate year and value is null, show blank instead of N/A
          displayValue = "";
        } else if (
          (metricName === "SG&A" || 
           metricName === "Total OpEx") && 
          isEstimateYear && 
          value === null
        ) {
          // For SG&A and Total OpEx, if it's an estimate year and value is null, show blank instead of N/A
          displayValue = "";
        } else if (
          (metricName === "Cost of Revenue" || 
           metricName === "Gross Profit" || 
           metricName === "Operating Income") && 
          isEstimateYear && 
          value === null
        ) {
          // For these metrics, if it's an estimate year and value is null, show blank
          displayValue = "";
        } else {
          displayValue = formatter(value);
        }
        
        // Calculate growth rate compared to previous year
        let growth = null;
        if (index > 0) {
          const prevYear = allYears[index - 1];
          const prevHistorical = data?.historical?.find(h => h.fiscalYear === prevYear);
          const prevEstimate = data?.estimates?.find(e => e.fiscalYear === prevYear);
          const prevValue = getHistoricalValue(prevYear) ?? getEstimateValue(prevYear);
          
          if (value && prevValue) {
            growth = calculateYoYGrowth(value, prevValue);
          }
        }
        
        return (
          <td key={year} className="py-1.5 pl-0 pr-2 w-[100px]">
            <div className="flex items-center justify-start gap-2">
              <div className="font-medium text-gray-900 text-sm text-left min-w-[60px]">
                {displayValue}
              </div>
              {/* Always reserve space for YoY % to maintain alignment with header */}
              <div className={cn(
                "text-xs whitespace-nowrap min-w-[45px]",
                growth ? GROWTH_COLORS.fontWeight : "",
                growth && growth.isPositive ? GROWTH_COLORS.positive : growth && !growth.isPositive ? GROWTH_COLORS.negative : ""
              )}>
                {growth ? growth.text : ""}
              </div>
            </div>
          </td>
        );
      })}
    </tr>
  );
};

export default function Financials({ loaderData }: Route.ComponentProps) {
  // Check subscription status and redirect if expired
  useSubscriptionCheck();
  
  const financialsState = useFinancialsState();
  const globalTicker = useGlobalTicker();
  const stockInfo = useStockInfo();
  const actions = useStockActions();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [searchParams] = useSearchParams();
  const [stockSymbol, setStockSymbol] = useState(globalTicker.currentTicker || 'AAPL');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'above' | 'below'>('above');
  const [tooltipCoords, setTooltipCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const startPolling = (ticker: string) => {
    if (pollingIntervalRef.current) {
      return; // Already polling
    }

    setIsPolling(true);
    // Keep loading state true while polling and clear any errors
    actions.setFinancialsLoading(true);
    actions.setFinancialsError(null);
    let attemptCount = 0;
    const MAX_ATTEMPTS = 60; // 60 attempts * 2 seconds = 120 seconds = 2 minutes
    const POLL_INTERVAL = 2000;

    const poll = async () => {
      attemptCount += 1;

      try {
        const cachedData = actions.getCachedFinancials(ticker);
        if (cachedData) {
          actions.setFinancialsData(cachedData);
          stopPolling();
          actions.setFinancialsLoading(false);
          return;
        }

        const data = await actions.fetchFinancials(ticker, authenticatedFetch);
        actions.setFinancialsData(data);
        stopPolling();
        actions.setFinancialsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const is404 = errorMessage.toLowerCase().includes('404') || 
                      errorMessage.toLowerCase().includes('not found');

        if (is404 && attemptCount < MAX_ATTEMPTS) {
          // Continue polling
          return;
        } else {
          // Stop polling
          stopPolling();
          actions.setFinancialsLoading(false);
          if (attemptCount >= MAX_ATTEMPTS) {
            actions.setFinancialsError(`Data not available after ${MAX_ATTEMPTS} attempts`);
          } else {
            actions.setFinancialsError(errorMessage);
          }
        }
      }
    };

    // Start polling immediately
    poll();
    
    // Then poll every interval
    pollingIntervalRef.current = setInterval(poll, POLL_INTERVAL);
  };

  const fetchFinancials = async (symbol: string) => {
    // Stop any existing polling
    stopPolling();
    
    actions.setFinancialsLoading(true);
    actions.setFinancialsError(null);
    actions.setStockInfoLoading(true);
    actions.setGlobalTicker(symbol); // Set global ticker
    // Don't set isPolling to false here - it will be set by startPolling if needed
    
    try {
      // Fetch stock info first (doesn't need polling)
      const stockInfoPromise = await Promise.allSettled([
        actions.fetchStockInfo(symbol, authenticatedFetch)
      ]);
      
      if (stockInfoPromise[0].status === 'rejected') {
        console.error("Error fetching stock info:", stockInfoPromise[0].reason);
        actions.setStockInfoError(stockInfoPromise[0].reason instanceof Error ? stockInfoPromise[0].reason.message : "Error fetching stock info");
      }

      // Fetch financials with polling support
      try {
        const cachedData = actions.getCachedFinancials(symbol);
        if (cachedData) {
          actions.setFinancialsData(cachedData);
          actions.setFinancialsLoading(false);
        } else {
          const data = await actions.fetchFinancials(symbol, authenticatedFetch);
          actions.setFinancialsData(data);
          actions.setFinancialsLoading(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error fetching financial data";
        const is404 = errorMessage.toLowerCase().includes('404') || 
                      errorMessage.toLowerCase().includes('not found') ||
                      errorMessage.toLowerCase().includes('does not exist') ||
                      errorMessage.toLowerCase().includes('failed to fetch financials for');

        if (is404) {
          // Start polling for 404 responses
          startPolling(symbol);
        } else {
          // Non-404 error
          actions.setFinancialsError(errorMessage);
          actions.setFinancialsLoading(false);
          
          // Clear the financials data
          actions.setFinancialsData({
            ticker: symbol,
            historical: [],
            estimates: []
          });
        }
      }
      
    } catch (err) {
      console.error("Unexpected error:", err);
      actions.setFinancialsError(err instanceof Error ? err.message : "Unexpected error occurred");
      actions.setStockInfoError(err instanceof Error ? err.message : "Unexpected error occurred");
      actions.setFinancialsLoading(false);
      actions.setStockInfoLoading(false);
    } finally {
      // Only set loading to false if not polling
      if (!isPolling) {
        actions.setFinancialsLoading(false);
      }
      actions.setStockInfoLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (stockSymbol.trim()) {
      fetchFinancials(stockSymbol.trim().toUpperCase());
    }
  };

  // Handle search click (no event parameter)
  const handleSearchClick = () => {
    if (stockSymbol.trim()) {
      fetchFinancials(stockSymbol.trim().toUpperCase());
    }
  };

  // Tooltip handlers
  const updateTooltipPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipHeight = 40; // Approximate tooltip height
      const spaceAbove = rect.top;
      
      // Determine position (above or below)
      if (spaceAbove < tooltipHeight + 20) {
        setTooltipPosition('below');
        setTooltipCoords({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2
        });
      } else {
        setTooltipPosition('above');
        setTooltipCoords({
          top: rect.top - 8,
          left: rect.left + rect.width / 2
        });
      }
    }
  };

  const handleTooltipToggle = () => {
    if (!showTooltip) {
      updateTooltipPosition();
    }
    setShowTooltip(!showTooltip);
  };

  const handleTooltipKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTooltipToggle();
    } else if (e.key === 'Escape') {
      setShowTooltip(false);
    }
  };

  // Check URL params first, then fall back to global ticker
  // Load data for ticker on component mount and when it changes
  useEffect(() => {
    const urlTicker = searchParams.get('ticker');
    const tickerToLoad = urlTicker ? urlTicker.toUpperCase() : (globalTicker.currentTicker || 'AAPL');
    
    // Update global ticker and input field if URL has ticker
    if (urlTicker) {
      const upperTicker = urlTicker.toUpperCase();
      if (upperTicker !== globalTicker.currentTicker) {
        actions.setGlobalTicker(upperTicker);
      }
      if (upperTicker !== stockSymbol) {
        setStockSymbol(upperTicker);
      }
    }
    
    // Always check if we need to fetch data for the current ticker
    if (tickerToLoad && (!financialsState?.data || financialsState.data.ticker !== tickerToLoad)) {
      // Set loading state immediately BEFORE fetching
      // This ensures overlay shows immediately when navigating to page
      actions.setFinancialsLoading(true);
      fetchFinancials(tickerToLoad);
    }
    
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, globalTicker.currentTicker]); // Depend on searchParams object and global ticker

  // Sync input field when global ticker changes from other pages
  useEffect(() => {
    if (globalTicker.currentTicker && globalTicker.currentTicker !== stockSymbol) {
      setStockSymbol(globalTicker.currentTicker);
    }
  }, [globalTicker.currentTicker]);

  const data = financialsState?.data;
  const loading = financialsState?.loading || stockInfo.loading || false;
  const error = financialsState?.error;

  // Get years for table headers (2021-2027) - sorted chronologically
  const historicalYears = data?.historical?.map(h => h.fiscalYear).filter(year => parseInt(year) >= 2021).sort() || [];
  let estimateYears = data?.estimates?.map(e => e.fiscalYear).filter(year => parseInt(year) >= 2021).sort() || [];
  let allYears = [...historicalYears, ...estimateYears].filter((year, index, arr) => arr.indexOf(year) === index).sort();
  
  // If no years available (e.g., ticker not found), show default range
  if (allYears.length === 0) {
    const currentYear = new Date().getFullYear();
    allYears = Array.from({ length: 6 }, (_, i) => (currentYear - 3 + i).toString());
    // Mark future years as estimates
    estimateYears = allYears.filter(year => parseInt(year) >= currentYear);
  }

  return (
    <AppLayout user={loaderData.user}>
      <main className="min-h-screen bg-page-background">
        <div className="container mx-auto px-6 py-8">
          <div className="w-full max-w-7xl mx-auto">
            
            <StockSearchHeader
              stockSymbol={stockSymbol}
              onStockSymbolChange={(value) => setStockSymbol(value.toUpperCase())}
              onSearch={handleSearchClick}
              loading={loading}
              ticker={stockInfo.data?.ticker || data?.ticker}
              stockPrice={stockInfo.data?.price || data?.price}
              marketCap={stockInfo.data?.market_cap || data?.market_cap}
              formatCurrency={formatLargeNumber}
              formatNumber={formatNumber}
              error={stockInfo.error}
            />

            {/* Error State - Only show non-404 errors */}
            {((error && !(
              error.toLowerCase().includes('not found') || 
              error.toLowerCase().includes('404') ||
              error.toLowerCase().includes('does not exist') ||
              error.toLowerCase().includes('failed to fetch financials for')
            )) || (stockInfo.error && !(
              stockInfo.error.toLowerCase().includes('not found') || 
              stockInfo.error.toLowerCase().includes('404') ||
              stockInfo.error.toLowerCase().includes('does not exist')
            ))) && (
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="text-red-600 text-center">
                    {error && !(
                      error.toLowerCase().includes('not found') || 
                      error.toLowerCase().includes('404') ||
                      error.toLowerCase().includes('does not exist') ||
                      error.toLowerCase().includes('failed to fetch financials for')
                    ) && <div>{error}</div>}
                    {stockInfo.error && !(
                      stockInfo.error.toLowerCase().includes('not found') || 
                      stockInfo.error.toLowerCase().includes('404') ||
                      stockInfo.error.toLowerCase().includes('does not exist')
                    ) && <div>{stockInfo.error}</div>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {loading ? (
              <Card className="mt-8 relative min-h-[400px]">
                <LoadingOverlay 
                  isLoading={loading || isPolling || false}
                />
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <div className="space-y-2">
                      {[...Array(12)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Financial Metrics Table */
              <Card className="mt-8 relative min-h-[400px]">
                <LoadingOverlay 
                  isLoading={loading || isPolling || false}
                />
                <CardContent className="pt-2 pb-5">
                  <div id="financials-metrics-table" className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      {/* Table Header */}
                      <thead>
                        <tr id="financials-table-header" className="border-b border-gray-200">
                          <th id="metric-column" className="py-2 pl-3 pr-0 text-left font-bold text-gray-900 text-sm uppercase tracking-wider w-[200px]">
                            <div className="flex items-center gap-2">
                              <span>METRIC</span>
                              <div className="relative">
                                <button
                                  ref={buttonRef}
                                  onClick={handleTooltipToggle}
                                  onKeyDown={handleTooltipKeyDown}
                                  onMouseEnter={() => {
                                    updateTooltipPosition();
                                    setShowTooltip(true);
                                  }}
                                  onMouseLeave={() => setShowTooltip(false)}
                                  className="inline-flex items-center justify-center w-4 h-4 text-gray-500 opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                                  aria-label="Information about data periods"
                                  aria-describedby="metric-tooltip"
                                  tabIndex={0}
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                                {showTooltip && typeof document !== 'undefined' && createPortal(
                                  <div
                                    id="metric-tooltip"
                                    className="fixed z-[9999] bg-gray-800 text-white text-xs px-3 py-2 rounded-md shadow-lg whitespace-nowrap pointer-events-none"
                                    role="tooltip"
                                    aria-live="polite"
                                    style={{
                                      top: tooltipPosition === 'above' ? `${tooltipCoords.top}px` : `${tooltipCoords.top}px`,
                                      left: `${tooltipCoords.left}px`,
                                      transform: tooltipPosition === 'above' 
                                        ? 'translate(-50%, -100%)' 
                                        : 'translate(-50%, 0)',
                                      opacity: showTooltip ? 1 : 0,
                                      transition: 'opacity 200ms ease-in-out'
                                    }}
                                  >
                                    Data reflects calendar year (Jan-Dec), not fiscal year
                                    <div 
                                      className="absolute left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"
                                      style={{
                                        top: tooltipPosition === 'above' ? '100%' : '-4px',
                                        marginTop: tooltipPosition === 'above' ? '-4px' : '0'
                                      }}
                                    ></div>
                                  </div>,
                                  document.body
                                )}
                              </div>
                            </div>
                          </th>
                          {allYears.map(year => (
                            <th key={year} id={`year-${year}`} className="py-2 pl-0 pr-2 text-left font-bold text-sm w-[100px] align-top">
                              <div className="flex items-center justify-start gap-2">
                                {/* Encapsulate year and EST in a centered div */}
                                <div className={`flex flex-col items-center min-w-[60px] ${estimateYears.includes(year) ? "text-blue-600" : "text-gray-900"}`}>
                                  <div>{year}</div>
                                  {estimateYears.includes(year) && (
                                    <div className="h-4 flex items-center justify-center">
                                      <span className="text-xs text-blue-600 font-semibold">EST</span>
                                    </div>
                                  )}
                                </div>
                                {/* Spacer to account for YoY % column in data rows - matches typical YoY % width */}
                                <div className="text-xs whitespace-nowrap min-w-[45px]"></div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody id="financials-table-sections">
                        {/* Revenue & Profitability Section */}
                        <tr className="bg-gray-50">
                          <td colSpan={allYears.length + 1} className="py-2 pl-3 pr-0 font-semibold text-gray-900 text-xs uppercase tracking-wider">
                            REVENUE & PROFITABILITY
                          </td>
                        </tr>

                        <MetricRow
                          metricName="Total Revenue"
                          data={data}
                          allYears={allYears}
                          estimateYears={estimateYears}
                          getHistoricalValue={(year) => data?.historical?.find(h => h.fiscalYear === year)?.totalRevenue || null}
                          getEstimateValue={(year) => data?.estimates?.find(e => e.fiscalYear === year)?.totalRevenue || null}
                          formatter={formatLargeNumber}
                        />

                        <MetricRow
                          metricName="Cost of Revenue"
                          data={data}
                          allYears={allYears}
                          estimateYears={estimateYears}
                          getHistoricalValue={(year) => data?.historical?.find(h => h.fiscalYear === year)?.costOfRevenue || null}
                          getEstimateValue={() => null}
                          formatter={formatCostOfRevenue}
                        />

                        <MetricRow
                          metricName="Gross Profit"
                          data={data}
                          allYears={allYears}
                          estimateYears={estimateYears}
                          getHistoricalValue={(year) => data?.historical?.find(h => h.fiscalYear === year)?.grossProfit || null}
                          getEstimateValue={() => null}
                          formatter={formatLargeNumber}
                        />

                        {/* Operating Expenses (OPEX) Section */}
                        <tr className="bg-gray-50">
                          <td colSpan={allYears.length + 1} className="py-2 pl-3 pr-0 font-semibold text-gray-900 text-xs uppercase tracking-wider">
                            OPERATING EXPENSES (OPEX)
                          </td>
                        </tr>

                        <MetricRow
                          metricName="SG&A"
                          data={data}
                          allYears={allYears}
                          estimateYears={estimateYears}
                          getHistoricalValue={(year) => data?.historical?.find(h => h.fiscalYear === year)?.sellingGeneralAndAdministrative || null}
                          getEstimateValue={() => null}
                          formatter={formatSGAAndOpEx}
                        />

                        <MetricRow
                          metricName="R&D"
                          data={data}
                          allYears={allYears}
                          estimateYears={estimateYears}
                          getHistoricalValue={(year) => data?.historical?.find(h => h.fiscalYear === year)?.researchAndDevelopment ?? null}
                          getEstimateValue={() => null}
                          formatter={formatRAndD}
                        />

                        <MetricRow
                          metricName="Total OpEx"
                          data={data}
                          allYears={allYears}
                          estimateYears={estimateYears}
                          getHistoricalValue={(year) => data?.historical?.find(h => h.fiscalYear === year)?.operatingExpenses || null}
                          getEstimateValue={() => null}
                          formatter={formatSGAAndOpEx}
                        />

                        <MetricRow
                          metricName="Operating Income"
                          data={data}
                          allYears={allYears}
                          estimateYears={estimateYears}
                          getHistoricalValue={(year) => data?.historical?.find(h => h.fiscalYear === year)?.operatingIncome || null}
                          getEstimateValue={() => null}
                          formatter={formatOperatingIncome}
                        />

                        {/* Net Income & EPS Section */}
                        <tr className="bg-gray-50">
                          <td colSpan={allYears.length + 1} className="py-2 pl-3 pr-0 font-semibold text-gray-900 text-xs uppercase tracking-wider">
                            NET INCOME & EPS
                          </td>
                        </tr>

                        <MetricRow
                          metricName="Net Income"
                          data={data}
                          allYears={allYears}
                          estimateYears={estimateYears}
                          getHistoricalValue={(year) => data?.historical?.find(h => h.fiscalYear === year)?.netIncome || null}
                          getEstimateValue={(year) => data?.estimates?.find(e => e.fiscalYear === year)?.netIncome || null}
                          formatter={formatLargeNumber}
                        />

                        <MetricRow
                          metricName="Basic EPS"
                          data={data}
                          allYears={allYears}
                          estimateYears={estimateYears}
                          getHistoricalValue={(year) => data?.historical?.find(h => h.fiscalYear === year)?.eps || null}
                          getEstimateValue={(year) => data?.estimates?.find(e => e.fiscalYear === year)?.eps || null}
                          formatter={formatEPS}
                        />

                        <MetricRow
                          metricName="Diluted EPS"
                          data={data}
                          allYears={allYears}
                          estimateYears={estimateYears}
                          getHistoricalValue={(year) => data?.historical?.find(h => h.fiscalYear === year)?.dilutedEps || null}
                          getEstimateValue={(year) => data?.estimates?.find(e => e.fiscalYear === year)?.dilutedEps || null}
                          formatter={formatEPS}
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}