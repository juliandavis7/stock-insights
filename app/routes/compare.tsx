import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { BarChart3 } from "lucide-react";
import { Navbar } from "~/components/homepage/navbar";
import { useCompareState, useStockActions } from "~/store/stockStore";
import type { Route } from "./+types/compare";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Compare Stocks - Stock Insights" },
    { name: "description", content: "Compare multiple stocks side-by-side" },
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

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "-";
  return `${value.toFixed(2)}%`;
};

const formatRatio = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "-";
  return value.toFixed(2);
};

const getMetricValue = (metrics: FinancialMetrics | null, metricKey: keyof FinancialMetrics): number | null => {
  if (!metrics) return null;
  return metrics[metricKey];
};

interface MetricRowProps {
  metric: string;
  ticker1: string;
  ticker2: string;
  ticker3: string;
  data1: FinancialMetrics | null;
  data2: FinancialMetrics | null;
  data3: FinancialMetrics | null;
  metricKey: keyof FinancialMetrics;
  formatter: (value: number | null) => string;
  benchmark: string;
  higherIsBetter?: boolean;
}

const MetricRow = ({ metric, ticker1, ticker2, ticker3, data1, data2, data3, metricKey, formatter, benchmark, higherIsBetter = true }: MetricRowProps) => {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50" id={`compare-metric-row-${metricKey.toLowerCase().replace(/_/g, '-')}`}>
      <td className="py-2 px-4 font-semibold text-gray-900 text-sm w-[200px]">{metric}</td>
      <td className="py-2 px-4 w-[360px]">
        <div className="grid grid-cols-3 gap-4">
          <span className="text-center font-medium text-sm" style={{ color: '#D97706' }}>{formatter(getMetricValue(data1, metricKey))}</span>
          <span className="text-center font-medium text-sm">{formatter(getMetricValue(data2, metricKey))}</span>
          <span className="text-center font-medium text-sm" style={{ color: '#0369A1' }}>{formatter(getMetricValue(data3, metricKey))}</span>
        </div>
      </td>
      <td className="py-2 px-4 text-muted-foreground text-sm w-[200px]">{benchmark}</td>
    </tr>
  );
};

export default function Compare({ loaderData }: Route.ComponentProps) {
  const compareState = useCompareState();
  const actions = useStockActions();
  const [inputTickers, setInputTickers] = useState<[string, string, string]>(compareState?.tickers || ['GOOG', 'AAPL', 'META']);

  const fetchMetrics = async (ticker: string, index: number) => {
    actions.setCompareLoading(index, true);
    actions.setCompareError(index, null);
    actions.setCompareTicker(index, ticker);
    
    try {
      // Check cache first, then fetch if needed
      const cachedData = actions.getCachedMetrics(ticker);
      if (cachedData) {
        actions.setCompareData(ticker, cachedData);
        actions.setCompareLoading(index, false);
        return;
      }
      
      const data = await actions.fetchMetrics(ticker);
      actions.setCompareData(ticker, data);
    } catch (err) {
      console.error(`Error fetching stock metrics for ${ticker}:`, err);
      const errorMessage = err instanceof Error ? err.message : "Error fetching stock metrics";
      actions.setCompareError(index, errorMessage);
    } finally {
      actions.setCompareLoading(index, false);
    }
  };

  const handleTickerChange = (index: number, value: string) => {
    const newTickers = [...inputTickers] as [string, string, string];
    newTickers[index] = value.toUpperCase();
    setInputTickers(newTickers);
  };

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    inputTickers.forEach((ticker, index) => {
      if (ticker.trim()) {
        fetchMetrics(ticker.trim(), index);
      }
    });
  };

  // Auto-load default stocks on component mount (only run once)
  useEffect(() => {
    const defaultTickers = ['GOOG', 'AAPL', 'META'];
    defaultTickers.forEach((ticker, index) => {
      fetchMetrics(ticker, index);
    });
  }, []); // Empty dependency array - run only once on mount

  // Sync input fields when returning to tab
  useEffect(() => {
    if (compareState?.tickers) {
      setInputTickers(compareState.tickers);
    }
  }, [compareState?.tickers]);


  const hasData = compareState?.data ? Object.values(compareState.data).some(data => data !== null) : false;
  const isLoading = compareState?.loading ? Object.values(compareState.loading).some(loading => loading) : false;

  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="w-full max-w-6xl mx-auto">
            
            {/* Stock Selection Form */}
            <div className="mb-4">
              <div className="flex flex-col items-center gap-3 py-2">
                {/* Compare Button - moved to top */}
                <Button 
                  id="compare-stocks-submit-button" 
                  type="submit" 
                  disabled={isLoading}
                  onClick={handleCompare}
                  className="flex-shrink-0"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Compare
                </Button>
                
                {/* Stock Input Fields - centered below button */}
                <div id="compare-stock-inputs-row" className="flex gap-4 justify-center">
                  <div>
                    <Input
                      id="compare-stock-input-1"
                      value={inputTickers[0]}
                      onChange={(e) => handleTickerChange(0, e.target.value)}
                      className="text-center border-2 focus:border-amber-200 focus:ring-amber-200 w-20"
                      style={{ borderColor: '#FED7AA' }}
                      placeholder="Stock 1"
                    />
                  </div>
                  <div>
                    <Input
                      id="compare-stock-input-2"
                      value={inputTickers[1]}
                      onChange={(e) => handleTickerChange(1, e.target.value)}
                      className="text-center w-20"
                      placeholder="Stock 2"
                    />
                  </div>
                  <div>
                    <Input
                      id="compare-stock-input-3"
                      value={inputTickers[2]}
                      onChange={(e) => handleTickerChange(2, e.target.value)}
                      className="text-center border-2 focus:border-blue-200 focus:ring-blue-200 w-20"
                      style={{ borderColor: '#BFDBFE' }}
                      placeholder="Stock 3"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Error States */}
            {compareState?.errors && Object.values(compareState.errors).some(error => error) && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {Object.entries(compareState.errors).map(([index, error]) => 
                      error ? (
                        <div key={index} className="text-red-600">
                          {compareState.tickers?.[parseInt(index)]}: {error}
                        </div>
                      ) : null
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <div className="space-y-2">
                      {[...Array(13)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comparison Results */}
            {!isLoading && (
              <div className="space-y-6 mt-6">
                {/* P/E Ratios Group */}
                <Card>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table id="compare-pe-ratios-table" className="w-full table-fixed">
                        <tbody>
                          <MetricRow
                            metric="TTM PE"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="ttm_pe"
                            formatter={formatRatio}
                            benchmark="Many stocks trade at 20-28"
                            higherIsBetter={false}
                          />
                          <MetricRow
                            metric="Forward PE"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="forward_pe"
                            formatter={formatRatio}
                            benchmark="Many stocks trade at 18-26"
                            higherIsBetter={false}
                          />
                          <MetricRow
                            metric="2 Year Forward PE"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="two_year_forward_pe"
                            formatter={formatRatio}
                            benchmark="Many stocks trade at 16-24"
                            higherIsBetter={false}
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
                      <table id="compare-eps-growth-table" className="w-full table-fixed">
                        <tbody>
                          <MetricRow
                            metric="TTM EPS Growth"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="ttm_eps_growth"
                            formatter={formatPercentage}
                            benchmark="Many stocks trade at 8-12%"
                          />
                          <MetricRow
                            metric="Current Yr Exp EPS Growth"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="current_year_eps_growth"
                            formatter={formatPercentage}
                            benchmark="Many stocks trade at 8-12%"
                          />
                          <MetricRow
                            metric="Next Year EPS Growth"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="next_year_eps_growth"
                            formatter={formatPercentage}
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
                      <table id="compare-revenue-growth-table" className="w-full table-fixed">
                        <tbody>
                          <MetricRow
                            metric="TTM Rev Growth"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="ttm_revenue_growth"
                            formatter={formatPercentage}
                            benchmark="Many stocks trade at 4.5-6.5%"
                          />
                          <MetricRow
                            metric="Current Yr Exp Rev Growth"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="current_year_revenue_growth"
                            formatter={formatPercentage}
                            benchmark="Many stocks trade at 4.5-6.5%"
                          />
                          <MetricRow
                            metric="Next Year Rev Growth"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="next_year_revenue_growth"
                            formatter={formatPercentage}
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
                      <table id="compare-margins-ratios-table" className="w-full table-fixed">
                        <tbody>
                          <MetricRow
                            metric="Gross Margin"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="gross_margin"
                            formatter={formatPercentage}
                            benchmark="Many stocks trade at 40-48%"
                          />
                          <MetricRow
                            metric="Net Margin"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="net_margin"
                            formatter={formatPercentage}
                            benchmark="Many stocks trade at 8-10%"
                          />
                          <MetricRow
                            metric="TTM P/S Ratio"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="ttm_ps_ratio"
                            formatter={formatRatio}
                            benchmark="Many stocks trade at 1.8-2.6"
                            higherIsBetter={false}
                          />
                          <MetricRow
                            metric="Forward P/S Ratio"
                            ticker1={compareState?.tickers?.[0] || ''}
                            ticker2={compareState?.tickers?.[1] || ''}
                            ticker3={compareState?.tickers?.[2] || ''}
                            data1={compareState?.data?.[compareState?.tickers?.[0] || ''] || null}
                            data2={compareState?.data?.[compareState?.tickers?.[1] || ''] || null}
                            data3={compareState?.data?.[compareState?.tickers?.[2] || ''] || null}
                            metricKey="forward_ps_ratio"
                            formatter={formatRatio}
                            benchmark="Many stocks trade at 1.8-2.6"
                            higherIsBetter={false}
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