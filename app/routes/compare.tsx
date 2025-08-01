import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { BarChart3 } from "lucide-react";
import { Navbar } from "~/components/homepage/navbar";
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
  TTM_PE: number | null;
  Forward_PE: number | null;
  Two_Year_Forward_PE: number | null;
  TTM_EPS_Growth: number | null;
  Current_Year_EPS_Growth: number | null;
  Next_Year_EPS_Growth: number | null;
  TTM_Revenue_Growth: number | null;
  Current_Year_Revenue_Growth: number | null;
  Next_Year_Revenue_Growth: number | null;
  Gross_Margin: number | null;
  Net_Margin: number | null;
  TTM_PS_Ratio: number | null;
  Forward_PS_Ratio: number | null;
}

interface StockComparison {
  ticker: string;
  metrics: FinancialMetrics | null;
  loading: boolean;
  error: string | null;
}

const formatPercentage = (value: number | null): string => {
  if (value === null) return "N/A";
  return `${value.toFixed(2)}%`;
};

const formatRatio = (value: number | null): string => {
  if (value === null) return "N/A";
  return value.toFixed(2);
};

const getMetricValue = (metrics: FinancialMetrics | null, metricKey: keyof FinancialMetrics): number | null => {
  if (!metrics) return null;
  return metrics[metricKey];
};

interface MetricRowProps {
  metric: string;
  stock1: StockComparison;
  stock2: StockComparison;
  stock3: StockComparison;
  metricKey: keyof FinancialMetrics;
  formatter: (value: number | null) => string;
  benchmark: string;
  higherIsBetter?: boolean;
}

const MetricRow = ({ metric, stock1, stock2, stock3, metricKey, formatter, benchmark, higherIsBetter = true }: MetricRowProps) => {
  return (
    <tr className="border-b" id={`compare-metric-row-${metricKey.toLowerCase().replace(/_/g, '-')}`}>
      <td className="py-3 px-4 font-medium w-1/3 text-left">{metric}</td>
      <td className="py-3 px-4 w-1/3 text-center">
        <div className="grid grid-cols-3 gap-4">
          <span className="text-center">{formatter(getMetricValue(stock1.metrics, metricKey))}</span>
          <span className="text-center">{formatter(getMetricValue(stock2.metrics, metricKey))}</span>
          <span className="text-center">{formatter(getMetricValue(stock3.metrics, metricKey))}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-muted-foreground w-1/3 text-center">{benchmark}</td>
    </tr>
  );
};

export default function Compare({ loaderData }: Route.ComponentProps) {
  const [stocks, setStocks] = useState<StockComparison[]>([
    { ticker: "AAPL", metrics: null, loading: false, error: null },
    { ticker: "MSFT", metrics: null, loading: false, error: null },
    { ticker: "GOOGL", metrics: null, loading: false, error: null }
  ]);

  const fetchMetrics = async (ticker: string, index: number) => {
    setStocks(prev => prev.map((stock, i) => 
      i === index ? { ...stock, loading: true, error: null } : stock
    ));
    
    try {
      const fastApiUrl = import.meta.env.VITE_FASTAPI_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${fastApiUrl}/metrics?ticker=${ticker.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data: FinancialMetrics = await response.json();
      
      setStocks(prev => prev.map((stock, i) => 
        i === index ? { ...stock, metrics: data, loading: false } : stock
      ));
    } catch (err) {
      console.error(`Error fetching stock metrics for ${ticker}:`, err);
      const errorMessage = err instanceof Error ? err.message : "Error fetching stock metrics";
      
      setStocks(prev => prev.map((stock, i) => 
        i === index ? { ...stock, error: errorMessage, loading: false } : stock
      ));
    }
  };

  const handleTickerChange = (index: number, value: string) => {
    setStocks(prev => prev.map((stock, i) => 
      i === index ? { ...stock, ticker: value.toUpperCase(), metrics: null, error: null } : stock
    ));
  };

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    stocks.forEach((stock, index) => {
      if (stock.ticker.trim()) {
        fetchMetrics(stock.ticker.trim(), index);
      }
    });
  };

  useEffect(() => {
    // Auto-fetch initial comparison on component mount
    handleCompare({ preventDefault: () => {} } as React.FormEvent);
  }, []);

  const hasData = stocks.some(stock => stock.metrics !== null);
  const isLoading = stocks.some(stock => stock.loading);

  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Compare Stocks
          </h1>
          <div className="w-full max-w-6xl mx-auto">
            
            {/* Stock Selection Form */}
            <div className="sticky top-20 z-10 mb-6">
              <Card>
                <CardContent>
                  <form onSubmit={handleCompare}>
                    <div id="compare-stock-selection-container" className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="w-1/3"></div>
                      <div id="compare-stock-inputs-row" className="w-1/3 grid grid-cols-3 gap-4 -ml-4">
                        <div>
                          <Input
                            id="compare-stock-input-1"
                            placeholder="Enter ticker (e.g., AAPL)"
                            value={stocks[0].ticker}
                            onChange={(e) => handleTickerChange(0, e.target.value)}
                            className="text-center"
                          />
                        </div>
                        <div>
                          <Input
                            id="compare-stock-input-2"
                            placeholder="Enter ticker (e.g., MSFT)"
                            value={stocks[1].ticker}
                            onChange={(e) => handleTickerChange(1, e.target.value)}
                            className="text-center"
                          />
                        </div>
                        <div>
                          <Input
                            id="compare-stock-input-3"
                            placeholder="Enter ticker (e.g., GOOGL)"
                            value={stocks[2].ticker}
                            onChange={(e) => handleTickerChange(2, e.target.value)}
                            className="text-center"
                          />
                        </div>
                      </div>
                      <Button 
                        id="compare-stocks-submit-button" 
                        type="submit" 
                        disabled={isLoading}
                        className="shrink-0"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Compare
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Error States */}
            {stocks.some(stock => stock.error) && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {stocks.map((stock, index) => 
                      stock.error ? (
                        <div key={index} className="text-red-600">
                          {stock.ticker}: {stock.error}
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
            {hasData && !isLoading && (
              <div className="space-y-6 mt-6">
                {/* P/E Ratios Group */}
                <Card>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table id="compare-pe-ratios-table" className="w-full">
                        <tbody>
                          <MetricRow
                            metric="TTM PE"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="TTM_PE"
                            formatter={formatRatio}
                            benchmark="Many stocks trade at 20-28"
                            higherIsBetter={false}
                          />
                          <MetricRow
                            metric="Forward PE"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="Forward_PE"
                            formatter={formatRatio}
                            benchmark="Many stocks trade at 18-26"
                            higherIsBetter={false}
                          />
                          <MetricRow
                            metric="2 Year Forward PE"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="Two_Year_Forward_PE"
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
                      <table id="compare-eps-growth-table" className="w-full">
                        <tbody>
                          <MetricRow
                            metric="TTM EPS Growth"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="TTM_EPS_Growth"
                            formatter={formatPercentage}
                            benchmark="Many stocks trade at 8-12%"
                          />
                          <MetricRow
                            metric="Current Yr Exp EPS Growth"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="Current_Year_EPS_Growth"
                            formatter={formatPercentage}
                            benchmark="Many stocks trade at 8-12%"
                          />
                          <MetricRow
                            metric="Next Year EPS Growth"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="Next_Year_EPS_Growth"
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
                      <table id="compare-revenue-growth-table" className="w-full">
                        <tbody>
                          <MetricRow
                            metric="TTM Rev Growth"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="TTM_Revenue_Growth"
                            formatter={formatPercentage}
                            benchmark="Many stocks trade at 4.5-6.5%"
                          />
                          <MetricRow
                            metric="Current Yr Exp Rev Growth"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="Current_Year_Revenue_Growth"
                            formatter={formatPercentage}
                            benchmark="Many stocks trade at 4.5-6.5%"
                          />
                          <MetricRow
                            metric="Next Year Rev Growth"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="Next_Year_Revenue_Growth"
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
                      <table id="compare-margins-ratios-table" className="w-full">
                        <tbody>
                          <MetricRow
                            metric="Gross Margin"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="Gross_Margin"
                            formatter={(val) => formatPercentage(val && val * 100)}
                            benchmark="Many stocks trade at 40-48%"
                          />
                          <MetricRow
                            metric="Net Margin"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="Net_Margin"
                            formatter={(val) => formatPercentage(val && val * 100)}
                            benchmark="Many stocks trade at 8-10%"
                          />
                          <MetricRow
                            metric="TTM P/S Ratio"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="TTM_PS_Ratio"
                            formatter={formatRatio}
                            benchmark="Many stocks trade at 1.8-2.6"
                            higherIsBetter={false}
                          />
                          <MetricRow
                            metric="Forward P/S Ratio"
                            stock1={stocks[0]}
                            stock2={stocks[1]}
                            stock3={stocks[2]}
                            metricKey="Forward_PS_Ratio"
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