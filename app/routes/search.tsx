import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { AppLayout } from "~/components/app-layout";
import { StockSearchHeader } from "~/components/stock-search-header";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { useSearchState, useStockActions, useGlobalTicker, useStockInfo } from "~/store/stockStore";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { useSubscriptionCheck } from "~/hooks/useSubscriptionCheck";
import { getAuth } from "@clerk/react-router/ssr.server";
import { createClerkClient } from "@clerk/react-router/api.server";
import { redirect } from "react-router";
import type { Route } from "./+types/search";
import { BRAND_NAME } from "~/config/brand";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Stock Search - ${BRAND_NAME}` },
    { name: "description", content: "Search for stocks and view key financial metrics" },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const { protectedRouteLoader } = await import("~/lib/routeProtection");
  return protectedRouteLoader(args);
}

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
  // Advanced EPS Metrics
  last_year_eps_growth: number | null;
  ttm_vs_ntm_eps_growth: number | null;
  current_quarter_eps_growth_vs_previous_year: number | null;
  two_year_stack_exp_eps_growth: number | null;
  // Advanced Revenue Metrics
  last_year_revenue_growth: number | null;
  ttm_vs_ntm_revenue_growth: number | null;
  current_quarter_revenue_growth_vs_previous_year: number | null;
  two_year_stack_exp_revenue_growth: number | null;
  // Advanced Valuation Metrics
  peg_ratio: number | null;
  return_on_equity: number | null;
  price_to_book: number | null;
  price_to_free_cash_flow: number | null;
  free_cash_flow_yield: number | null;
  dividend_yield: number | null;
  dividend_payout_ratio: number | null;
  // Stock info fields removed - use centralized stockInfo state instead
  ticker: string | null;
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
  if (value === null || value === undefined || isNaN(value)) return "$0";
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

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return value.toLocaleString();
};

const formatLargeNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  
  const absValue = Math.abs(value);
  if (absValue >= 1e9) {
    return `${formatNumberValue(value / 1e9)}B`;
  } else if (absValue >= 1e6) {
    return `${formatNumberValue(value / 1e6)}M`;
  }
  
  return formatNumberValue(value);
};

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  return `${formatNumberValue(value)}%`;
};

const formatRatio = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  return formatNumberValue(value);
};


interface MetricRowProps {
  metric: string;
  value: string;
  benchmark: string;
}

const MetricRow = ({ metric, value, benchmark }: MetricRowProps) => {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-2 px-4 font-semibold text-gray-900 text-sm w-[200px]">{metric}</td>
      <td className="py-2 px-4 text-center font-medium text-gray-900 text-sm w-[300px]">
        {value}
      </td>
      <td className="py-2 px-4 text-muted-foreground text-sm w-[200px]">{benchmark}</td>
    </tr>
  );
};

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  // Check subscription status and redirect if expired
  useSubscriptionCheck();
  
  const searchState = useSearchState();
  const globalTicker = useGlobalTicker();
  const stockInfo = useStockInfo();
  const actions = useStockActions();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [searchParams] = useSearchParams();
  const [stockSymbol, setStockSymbol] = useState(globalTicker.currentTicker || 'AAPL');
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
    actions.setSearchLoading(true);
    actions.setSearchError(null);
    let attemptCount = 0;
    const MAX_ATTEMPTS = 60; // 60 attempts * 2 seconds = 120 seconds = 2 minutes
    const POLL_INTERVAL = 2000;

    const poll = async () => {
      attemptCount += 1;

      try {
        const cachedData = actions.getCachedMetrics(ticker);
        if (cachedData) {
          actions.setSearchData(cachedData);
          stopPolling();
          actions.setSearchLoading(false);
          return;
        }

        const data = await actions.fetchMetrics(ticker, authenticatedFetch);
        actions.setSearchData(data);
        stopPolling();
        actions.setSearchLoading(false);
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
          actions.setSearchLoading(false);
          if (attemptCount >= MAX_ATTEMPTS) {
            actions.setSearchError(`Data not available after ${MAX_ATTEMPTS} attempts`);
          } else {
            actions.setSearchError(errorMessage);
            // Fallback to sample data if API fails
            actions.setSearchData(sampleMetrics);
          }
        }
      }
    };

    // Start polling immediately
    poll();
    
    // Then poll every interval
    pollingIntervalRef.current = setInterval(poll, POLL_INTERVAL);
  };

  // Hard-coded sample data matching the FastAPI response structure
  const sampleMetrics: FinancialMetrics = {
    ttm_pe: 17.80,
    forward_pe: 17.13,
    two_year_forward_pe: 15.97,
    ttm_eps_growth: 15.37,
    current_year_eps_growth: 7.60,
    next_year_eps_growth: 12.64,
    ttm_revenue_growth: 8.66,
    current_year_revenue_growth: 8.67,
    next_year_revenue_growth: 8.95,
    gross_margin: 40.23,
    net_margin: 14.31,
    ttm_ps_ratio: 2.55,
    forward_ps_ratio: 2.54,
    // Stock info fields removed - use centralized stockInfo state instead
    ticker: "AAPL"
  };

  const fetchMetrics = async (symbol: string) => {
    // Stop any existing polling
    stopPolling();
    
    actions.setSearchLoading(true);
    actions.setSearchError(null);
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

      // Fetch metrics with polling support
      try {
        const cachedData = actions.getCachedMetrics(symbol);
        if (cachedData) {
          actions.setSearchData(cachedData);
          actions.setSearchLoading(false);
        } else {
          const data = await actions.fetchMetrics(symbol, authenticatedFetch);
          actions.setSearchData(data);
          actions.setSearchLoading(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error fetching stock metrics";
        const is404 = errorMessage.toLowerCase().includes('404') || 
                      errorMessage.toLowerCase().includes('not found') ||
                      errorMessage.toLowerCase().includes('does not exist');

        if (is404) {
          // Start polling for 404 responses
          startPolling(symbol);
        } else {
          // Non-404 error
          actions.setSearchError(errorMessage);
          actions.setSearchLoading(false);
          // Fallback to sample data if API fails
          actions.setSearchData(sampleMetrics);
        }
      }
      
    } catch (err) {
      console.error("Unexpected error:", err);
      actions.setSearchError(err instanceof Error ? err.message : "Unexpected error occurred");
      actions.setStockInfoError(err instanceof Error ? err.message : "Unexpected error occurred");
      actions.setSearchLoading(false);
      actions.setStockInfoLoading(false);
    } finally {
      // Only set loading to false if not polling
      if (!isPolling) {
        actions.setSearchLoading(false);
      }
      actions.setStockInfoLoading(false);
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
    if (tickerToLoad && (!searchState?.data || searchState.data.ticker !== tickerToLoad)) {
      fetchMetrics(tickerToLoad);
    }
    
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, globalTicker.currentTicker]); // Depend on searchParams object and global ticker

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (stockSymbol.trim()) {
      fetchMetrics(stockSymbol.trim());
    }
  };

  const handleSearchClick = () => {
    if (stockSymbol.trim()) {
      fetchMetrics(stockSymbol.trim());
    }
  };

  // Sync input field when global ticker changes from other pages
  useEffect(() => {
    if (globalTicker.currentTicker && globalTicker.currentTicker !== stockSymbol) {
      setStockSymbol(globalTicker.currentTicker);
    }
  }, [globalTicker.currentTicker]);

  return (
    <AppLayout user={loaderData.user}>
      <main className="min-h-screen bg-page-background">
        <div className="container mx-auto px-6 py-8">
          <div className="w-full max-w-4xl mx-auto">
          <StockSearchHeader
            stockSymbol={stockSymbol}
            onStockSymbolChange={setStockSymbol}
            onSearch={handleSearchClick}
            loading={searchState.loading || stockInfo.loading}
            ticker={stockInfo.data?.ticker}
            stockPrice={stockInfo.data?.price}
            marketCap={stockInfo.data?.market_cap}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            error={stockInfo.error}
          />

          {/* Error State - Only show non-404 errors */}
          {(searchState.error || (stockInfo.error && !(
            stockInfo.error.toLowerCase().includes('not found') || 
            stockInfo.error.toLowerCase().includes('404') ||
            stockInfo.error.toLowerCase().includes('does not exist')
          ))) && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="text-red-600 text-center">
                  {searchState.error && <div>{searchState.error}</div>}
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
          {searchState.loading ? (
            <Card className="relative min-h-[400px]">
              <LoadingOverlay 
                isLoading={searchState.loading || false}
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
            <div className="space-y-6">
              {/* P/E Ratios Group */}
              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table id="search-pe-ratios-table" className="w-full table-fixed">
                      <tbody>
                        <MetricRow
                          metric="TTM PE"
                          value={formatRatio(searchState.data?.ttm_pe)}
                          benchmark="Many stocks trade at 20-28"
                        />
                        <MetricRow
                          metric="Forward PE"
                          value={formatRatio(searchState.data?.forward_pe)}
                          benchmark="Many stocks trade at 18-26"
                        />
                        <MetricRow
                          metric="2 Year Forward PE"
                          value={formatRatio(searchState.data?.two_year_forward_pe)}
                          benchmark="Many stocks trade at 16-24"
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* EPS Growth Group */}
              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table id="search-eps-growth-table" className="w-full table-fixed">
                      <tbody>
                        <MetricRow
                          metric="TTM EPS Growth"
                          value={formatPercentage(searchState.data?.ttm_eps_growth)}
                          benchmark="Many stocks trade at 8-12%"
                        />
                        <MetricRow
                          metric="Current Yr Exp EPS Growth"
                          value={formatPercentage(searchState.data?.current_year_eps_growth)}
                          benchmark="Many stocks trade at 8-12%"
                        />
                        <MetricRow
                          metric="Next Year EPS Growth"
                          value={formatPercentage(searchState.data?.next_year_eps_growth)}
                          benchmark="Many stocks trade at 8-12%"
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Growth Group */}
              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table id="search-revenue-growth-table" className="w-full table-fixed">
                      <tbody>
                        <MetricRow
                          metric="TTM Rev Growth"
                          value={formatPercentage(searchState.data?.ttm_revenue_growth)}
                          benchmark="Many stocks trade at 4.5-6.5%"
                        />
                        <MetricRow
                          metric="Current Yr Exp Rev Growth"
                          value={formatPercentage(searchState.data?.current_year_revenue_growth)}
                          benchmark="Many stocks trade at 4.5-6.5%"
                        />
                        <MetricRow
                          metric="Next Year Rev Growth"
                          value={formatPercentage(searchState.data?.next_year_revenue_growth)}
                          benchmark="Many stocks trade at 4.5-6.5%"
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Margins & Ratios Group */}
              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table id="search-margins-ratios-table" className="w-full table-fixed">
                      <tbody>
                        <MetricRow
                          metric="Gross Margin"
                          value={formatPercentage(searchState.data?.gross_margin)}
                          benchmark="Many stocks trade at 40-48%"
                        />
                        <MetricRow
                          metric="Net Margin"
                          value={formatPercentage(searchState.data?.net_margin)}
                          benchmark="Many stocks trade at 8-10%"
                        />
                        <MetricRow
                          metric="TTM P/S Ratio"
                          value={formatRatio(searchState.data?.ttm_ps_ratio)}
                          benchmark="Many stocks trade at 1.8-2.6"
                        />
                        <MetricRow
                          metric="Forward P/S Ratio"
                          value={formatRatio(searchState.data?.forward_ps_ratio)}
                          benchmark="Many stocks trade at 1.8-2.6"
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced EPS Metrics Group */}
              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table id="search-advanced-eps-metrics-table" className="w-full table-fixed">
                      <tbody>
                        <MetricRow
                          metric="Last Year EPS Growth"
                          value={formatPercentage(searchState.data?.last_year_eps_growth)}
                          benchmark="Many stocks trade at 8-12%"
                        />
                        <MetricRow
                          metric="TTM vs NTM EPS Growth"
                          value={formatPercentage(searchState.data?.ttm_vs_ntm_eps_growth)}
                          benchmark="Many stocks trade at 8-12%"
                        />
                        <MetricRow
                          metric="Last Quarter EPS Growth YoY"
                          value={formatPercentage(searchState.data?.current_quarter_eps_growth_vs_previous_year)}
                          benchmark="Many stocks trade at 8-12%"
                        />
                        <MetricRow
                          metric="2 Year Stack EPS Growth"
                          value={formatPercentage(searchState.data?.two_year_stack_exp_eps_growth)}
                          benchmark="Many stocks trade at 16-25%"
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Revenue Metrics Group */}
              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table id="search-advanced-revenue-metrics-table" className="w-full table-fixed">
                      <tbody>
                        <MetricRow
                          metric="Last Year Rev Growth"
                          value={formatPercentage(searchState.data?.last_year_revenue_growth)}
                          benchmark="Many stocks trade at 4.5-6.5%"
                        />
                        <MetricRow
                          metric="TTM vs NTM Rev Growth"
                          value={formatPercentage(searchState.data?.ttm_vs_ntm_revenue_growth)}
                          benchmark="Many stocks trade at 4.5-6.5%"
                        />
                        <MetricRow
                          metric="Last Quarter Rev Growth YoY"
                          value={formatPercentage(searchState.data?.current_quarter_revenue_growth_vs_previous_year)}
                          benchmark="Many stocks trade at 4.5-6.5%"
                        />
                        <MetricRow
                          metric="2 Year Stack Rev Growth"
                          value={formatPercentage(searchState.data?.two_year_stack_exp_revenue_growth)}
                          benchmark="Many stocks trade at 9-13%"
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Valuation Metrics Group */}
              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table id="search-advanced-valuation-metrics-table" className="w-full table-fixed">
                      <tbody>
                        <MetricRow
                          metric="PEG Ratio"
                          value={formatRatio(searchState.data?.peg_ratio)}
                          benchmark="Many stocks trade at 1-1.5"
                        />
                        <MetricRow
                          metric="Return on Equity"
                          value={formatPercentage(searchState.data?.return_on_equity)}
                          benchmark="Many stocks trade at 15-21%"
                        />
                        <MetricRow
                          metric="Price to Book"
                          value={formatRatio(searchState.data?.price_to_book)}
                          benchmark="Many stocks trade at 3-4"
                        />
                        <MetricRow
                          metric="Price to Free Cash Flow"
                          value={formatRatio(searchState.data?.price_to_free_cash_flow)}
                          benchmark="Many stocks trade at 20-25"
                        />
                        <MetricRow
                          metric="Free Cash Flow Yield"
                          value={formatPercentage(searchState.data?.free_cash_flow_yield)}
                          benchmark="Many stocks trade at 3-6%"
                        />
                        <MetricRow
                          metric="Dividend Yield"
                          value={formatPercentage(searchState.data?.dividend_yield)}
                          benchmark="Many stocks trade at 1.5-2.1%"
                        />
                        <MetricRow
                          metric="Dividend Payout Ratio"
                          value={formatPercentage(searchState.data?.dividend_payout_ratio)}
                          benchmark="Many stocks trade at 32-42%"
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}