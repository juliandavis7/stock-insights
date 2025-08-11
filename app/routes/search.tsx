import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Navbar } from "~/components/homepage/navbar";
import { StockSearchHeader } from "~/components/stock-search-header";
import { useSearchState, useStockActions, useGlobalTicker } from "~/store/stockStore";
import type { Route } from "./+types/search";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Stock Search - Stock Insights" },
    { name: "description", content: "Search for stocks and view key financial metrics" },
  ];
}

export async function loader() {
  return {
    isSignedIn: false,
    hasActiveSubscription: false,
  };
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
  // Stock info fields from expanded metrics endpoint
  ticker: string | null;
  price: number | null;
  market_cap: number | null;
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
    <td className="py-2 px-4 text-center font-medium text-gray-900 text-sm w-[120px]">{value}</td>
    <td className="py-2 px-4 text-muted-foreground text-sm w-[200px]">{benchmark}</td>
  </tr>
);

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const searchState = useSearchState();
  const globalTicker = useGlobalTicker();
  const actions = useStockActions();
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
    // Sample stock info
    ticker: "AAPL",
    price: 150.25,
    market_cap: 2500000000000
  };

  const fetchMetrics = async (symbol: string) => {
    actions.setSearchLoading(true);
    actions.setSearchError(null);
    actions.setGlobalTicker(symbol); // Set global ticker
    
    try {
      // Check cache first, then fetch if needed
      const cachedData = actions.getCachedMetrics(symbol);
      if (cachedData) {
        actions.setSearchData(cachedData);
        actions.setSearchLoading(false);
        return;
      }
      
      const data = await actions.fetchMetrics(symbol);
      actions.setSearchData(data);
    } catch (err) {
      console.error("Error fetching stock metrics:", err);
      actions.setSearchError(err instanceof Error ? err.message : "Error fetching stock metrics");
      
      // Fallback to sample data if API fails
      actions.setSearchData(sampleMetrics);
    } finally {
      actions.setSearchLoading(false);
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

  // Sync input field when global ticker changes from other pages
  useEffect(() => {
    if (globalTicker.currentTicker && globalTicker.currentTicker !== stockSymbol) {
      setStockSymbol(globalTicker.currentTicker);
    }
  }, [globalTicker.currentTicker]);

  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="w-full max-w-4xl mx-auto">
          <StockSearchHeader
            stockSymbol={stockSymbol}
            onStockSymbolChange={setStockSymbol}
            onSearch={handleSearch}
            loading={searchState.loading}
            ticker={searchState.data?.ticker}
            stockPrice={searchState.data?.price}
            marketCap={searchState.data?.market_cap}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />

          {/* Error State */}
          {searchState.error && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="text-red-600 text-center">{searchState.error}</div>
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
    </>
  );
}