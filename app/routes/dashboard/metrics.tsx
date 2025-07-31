"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Search } from "lucide-react";

interface FinancialMetrics {
  symbol: string;
  currentPrice: number;
  currentPriceSource: 'provided' | 'fetched' | 'default';
  marketCap: number | null;
  
  // Required PE Ratios
  ttmPE: number | null;
  forwardPE: number | null;
  twoYearForwardPE: number | null;
  
  // Required EPS Growth
  ttmEPSGrowth: number | null;
  currentYearEPSGrowth: number | null;
  nextYearEPSGrowth: number | null;
  
  // Required Revenue Growth
  ttmRevenueGrowth: number | null;
  currentYearExpectedRevenueGrowth: number | null;
  nextYearRevenueGrowth: number | null;
  
  // Required Margins
  grossMargin: number | null;
  netMargin: number | null;
  
  // Required Price-to-Sales
  ttmPriceToSales: number | null;
  forwardPriceToSales: number | null;
}

interface MetricsResponse {
  success: boolean;
  data: FinancialMetrics;
  timestamp: string;
  error?: string;
  message?: string;
}

const formatCurrency = (value: number | null): string => {
  if (value === null) return "N/A";
  return `$${value.toFixed(2)}`;
};

const formatLargeNumber = (value: number | null): string => {
  if (value === null) return "N/A";
  
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  
  return value.toFixed(2);
};

const formatPercentage = (value: number | null): string => {
  if (value === null) return "N/A";
  return `${value.toFixed(2)}%`;
};

const formatRatio = (value: number | null): string => {
  if (value === null) return "N/A";
  return value.toFixed(2);
};

interface MetricRowProps {
  metric: string;
  value: string;
  benchmark: string;
}

const MetricRow = ({ metric, value, benchmark }: MetricRowProps) => (
  <tr className="border-b">
    <td className="py-3 px-4 font-medium">{metric}</td>
    <td className="py-3 px-4">{value}</td>
    <td className="py-3 px-4 text-muted-foreground">{benchmark}</td>
  </tr>
);

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockSymbol, setStockSymbol] = useState("AAPL");

  // Hard-coded sample data matching the CLAUDE.md specification
  const sampleMetrics: FinancialMetrics = {
    symbol: "AAPL",
    currentPrice: 76.72,
    currentPriceSource: 'provided',
    marketCap: 79020000000, // 79.02B
    ttmPE: 17.80,
    forwardPE: 17.13,
    twoYearForwardPE: 15.97,
    ttmEPSGrowth: 15.37,
    currentYearEPSGrowth: 7.60,
    nextYearEPSGrowth: 12.64,
    ttmRevenueGrowth: 8.66,
    currentYearExpectedRevenueGrowth: 8.67,
    nextYearRevenueGrowth: 8.95,
    grossMargin: 40.23,
    netMargin: 14.31,
    ttmPriceToSales: 2.55,
    forwardPriceToSales: 2.54
  };

  const fetchMetrics = async (symbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const convexUrl = import.meta.env.VITE_CONVEX_URL || "http://127.0.0.1:3211";
      const response = await fetch(`${convexUrl}/stock/metrics?stock_name=${symbol.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data: MetricsResponse = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      } else {
        setError(data.message || "Failed to fetch metrics");
      }
    } catch (err) {
      console.error("Error fetching stock metrics:", err);
      setError(err instanceof Error ? err.message : "Error fetching stock metrics");
      
      // Fallback to sample data if API fails
      setMetrics({
        ...sampleMetrics,
        symbol: symbol.toUpperCase()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(stockSymbol);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (stockSymbol.trim()) {
      fetchMetrics(stockSymbol.trim());
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
                <div className="flex-1">
                  <Label htmlFor="stock-symbol" className="sr-only">
                    Stock Symbol
                  </Label>
                  <Input
                    id="stock-symbol"
                    placeholder="Enter stock symbol (e.g., AAPL)"
                    value={stockSymbol}
                    onChange={(e) => setStockSymbol(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-red-600 text-center">{error}</div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading ? (
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
          ) : metrics ? (
            <div className="space-y-6">
              {/* Header with Stock Price and Market Cap */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-lg font-semibold text-center">
                    <span className="uppercase">{metrics.symbol}</span> STOCK PRICE: {formatCurrency(metrics.currentPrice)} | MKT.CAP {formatLargeNumber(metrics.marketCap)}
                  </div>
                </CardContent>
              </Card>

              {/* Metrics Table */}
              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left font-medium">Metric</th>
                          <th className="py-3 px-4 text-left font-medium">Value</th>
                          <th className="py-3 px-4 text-left font-medium">Benchmark Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        <MetricRow
                          metric="TTM PE"
                          value={formatRatio(metrics.ttmPE)}
                          benchmark="Many stocks trade at 20-28"
                        />
                        <MetricRow
                          metric="Forward PE"
                          value={formatRatio(metrics.forwardPE)}
                          benchmark="Many stocks trade at 18-26"
                        />
                        <MetricRow
                          metric="2 Year Forward PE"
                          value={formatRatio(metrics.twoYearForwardPE)}
                          benchmark="Many stocks trade at 16-24"
                        />
                        <MetricRow
                          metric="TTM EPS Growth"
                          value={formatPercentage(metrics.ttmEPSGrowth)}
                          benchmark="Many stocks trade at 8-12%"
                        />
                        <MetricRow
                          metric="Current Yr Exp EPS Growth"
                          value={formatPercentage(metrics.currentYearEPSGrowth)}
                          benchmark="Many stocks trade at 8-12%"
                        />
                        <MetricRow
                          metric="Next Year EPS Growth"
                          value={formatPercentage(metrics.nextYearEPSGrowth)}
                          benchmark="Many stocks trade at 8-12%"
                        />
                        <MetricRow
                          metric="TTM Rev Growth"
                          value={formatPercentage(metrics.ttmRevenueGrowth)}
                          benchmark="Many stocks trade at 4.5-6.5%"
                        />
                        <MetricRow
                          metric="Current Yr Exp Rev Growth"
                          value={formatPercentage(metrics.currentYearExpectedRevenueGrowth)}
                          benchmark="Many stocks trade at 4.5-6.5%"
                        />
                        <MetricRow
                          metric="Next Year Rev Growth"
                          value={formatPercentage(metrics.nextYearRevenueGrowth)}
                          benchmark="Many stocks trade at 4.5-6.5%"
                        />
                        <MetricRow
                          metric="Gross Margin"
                          value={formatPercentage(metrics.grossMargin)}
                          benchmark="Many stocks trade at 40-48%"
                        />
                        <MetricRow
                          metric="Net Margin"
                          value={formatPercentage(metrics.netMargin)}
                          benchmark="Many stocks trade at 8-10%"
                        />
                        <MetricRow
                          metric="TTM P/S Ratio"
                          value={formatRatio(metrics.ttmPriceToSales)}
                          benchmark="Many stocks trade at 1.8-2.6"
                        />
                        <MetricRow
                          metric="Forward P/S Ratio"
                          value={formatRatio(metrics.forwardPriceToSales)}
                          benchmark="Many stocks trade at 1.8-2.6"
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}