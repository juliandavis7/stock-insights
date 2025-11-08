import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { AppLayout } from "~/components/app-layout";
import { StockSearchHeader } from "~/components/stock-search-header";
import { useSearchState, useStockActions, useGlobalTicker, useStockInfo } from "~/store/stockStore";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
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
  const { userId } = await getAuth(args);
  
  // Redirect to homepage if not authenticated
  if (!userId) {
    throw redirect("/");
  }

  // Get user details from Clerk
  const user = await createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  }).users.getUser(userId);

  return { user };
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
  // Stock info fields removed - use centralized stockInfo state instead
  ticker: string | null;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "$0";
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toFixed(2)}`;
};

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return value.toLocaleString();
};

const formatLargeNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "-";
  
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  
  return value.toFixed(2);
};

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "-";
  return `${value.toFixed(2)}%`;
};

const formatRatio = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "-";
  return value.toFixed(2);
};

interface MetricRowProps {
  metric: string;
  value: string;
  benchmark: string;
}

const MetricRow = ({ metric, value, benchmark }: MetricRowProps) => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="py-2 px-4 font-semibold text-gray-900 text-sm w-[200px]">{metric}</td>
    <td className="py-2 px-4 text-center font-medium text-gray-900 text-sm w-[300px]">{value}</td>
    <td className="py-2 px-4 text-muted-foreground text-sm w-[200px]">{benchmark}</td>
  </tr>
);

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const searchState = useSearchState();
  const globalTicker = useGlobalTicker();
  const stockInfo = useStockInfo();
  const actions = useStockActions();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [stockSymbol, setStockSymbol] = useState(globalTicker.currentTicker || 'AAPL');

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
    actions.setSearchLoading(true);
    actions.setSearchError(null);
    actions.setStockInfoLoading(true);
    actions.setGlobalTicker(symbol); // Set global ticker
    
    try {
      // Fetch both metrics and stock info concurrently
      const [metricsPromise, stockInfoPromise] = await Promise.allSettled([
        // Check cache first for metrics, then fetch if needed
        (async () => {
          const cachedData = actions.getCachedMetrics(symbol);
          if (cachedData) return cachedData;
          return await actions.fetchMetrics(symbol, authenticatedFetch);
        })(),
        // Fetch stock info (handles its own caching)
        actions.fetchStockInfo(symbol, authenticatedFetch)
      ]);
      
      // Handle metrics result
      if (metricsPromise.status === 'fulfilled') {
        actions.setSearchData(metricsPromise.value);
      } else {
        console.error("Error fetching stock metrics:", metricsPromise.reason);
        actions.setSearchError(metricsPromise.reason instanceof Error ? metricsPromise.reason.message : "Error fetching stock metrics");
        // Fallback to sample data if API fails
        actions.setSearchData(sampleMetrics);
      }
      
      // Stock info is automatically handled by the fetchStockInfo action
      if (stockInfoPromise.status === 'rejected') {
        console.error("Error fetching stock info:", stockInfoPromise.reason);
        actions.setStockInfoError(stockInfoPromise.reason instanceof Error ? stockInfoPromise.reason.message : "Error fetching stock info");
      }
      
    } catch (err) {
      console.error("Unexpected error:", err);
      actions.setSearchError(err instanceof Error ? err.message : "Unexpected error occurred");
      actions.setStockInfoError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      actions.setSearchLoading(false);
      actions.setStockInfoLoading(false);
    }
  };

  // Load data for current ticker on component mount
  useEffect(() => {
    const tickerToLoad = globalTicker.currentTicker || 'AAPL';
    if (tickerToLoad && (!searchState?.data || searchState.data.ticker !== tickerToLoad)) {
      fetchMetrics(tickerToLoad);
    }
  }, []); // Empty dependency array - run only once on mount

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
            <Card>
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
            </div>
          )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}