import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Search } from "lucide-react";
import { Navbar } from "~/components/homepage/navbar";
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
    <td className="py-3 px-4 font-medium w-1/3 text-left">{metric}</td>
    <td className="py-3 px-4 w-1/3 text-center">{value}</td>
    <td className="py-3 px-4 text-muted-foreground w-1/3 text-center">{benchmark}</td>
  </tr>
);

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockSymbol, setStockSymbol] = useState("AAPL");

  // Hard-coded sample data matching the FastAPI response structure
  const sampleMetrics: FinancialMetrics = {
    TTM_PE: 17.80,
    Forward_PE: 17.13,
    Two_Year_Forward_PE: 15.97,
    TTM_EPS_Growth: 15.37,
    Current_Year_EPS_Growth: 7.60,
    Next_Year_EPS_Growth: 12.64,
    TTM_Revenue_Growth: 8.66,
    Current_Year_Revenue_Growth: 8.67,
    Next_Year_Revenue_Growth: 8.95,
    Gross_Margin: 40.23,
    Net_Margin: 14.31,
    TTM_PS_Ratio: 2.55,
    Forward_PS_Ratio: 2.54
  };

  const fetchMetrics = async (symbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const fastApiUrl = import.meta.env.VITE_FASTAPI_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${fastApiUrl}/metrics?ticker=${symbol.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data: FinancialMetrics = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error("Error fetching stock metrics:", err);
      setError(err instanceof Error ? err.message : "Error fetching stock metrics");
      
      // Fallback to sample data if API fails
      setMetrics(sampleMetrics);
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
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Stock Search
          </h1>
          <div className="w-full max-w-4xl mx-auto">
          {/* Search Form */}
          <div className="sticky top-20 z-10 mb-6">
            <Card>
              <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
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
          </div>

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
              {/* P/E Ratios Group */}
              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table id="search-pe-ratios-table" className="w-full">
                      <tbody>
                        <MetricRow
                          metric="TTM PE"
                          value={formatRatio(metrics.TTM_PE)}
                          benchmark="Many stocks trade at 20-28"
                        />
                        <MetricRow
                          metric="Forward PE"
                          value={formatRatio(metrics.Forward_PE)}
                          benchmark="Many stocks trade at 18-26"
                        />
                        <MetricRow
                          metric="2 Year Forward PE"
                          value={formatRatio(metrics.Two_Year_Forward_PE)}
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
                    <table id="search-eps-growth-table" className="w-full">
                      <tbody>
                        <MetricRow
                          metric="TTM EPS Growth"
                          value={formatPercentage(metrics.TTM_EPS_Growth)}
                          benchmark="Many stocks trade at 8-12%"
                        />
                        <MetricRow
                          metric="Current Yr Exp EPS Growth"
                          value={formatPercentage(metrics.Current_Year_EPS_Growth)}
                          benchmark="Many stocks trade at 8-12%"
                        />
                        <MetricRow
                          metric="Next Year EPS Growth"
                          value={formatPercentage(metrics.Next_Year_EPS_Growth)}
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
                    <table id="search-revenue-growth-table" className="w-full">
                      <tbody>
                        <MetricRow
                          metric="TTM Rev Growth"
                          value={formatPercentage(metrics.TTM_Revenue_Growth)}
                          benchmark="Many stocks trade at 4.5-6.5%"
                        />
                        <MetricRow
                          metric="Current Yr Exp Rev Growth"
                          value={formatPercentage(metrics.Current_Year_Revenue_Growth)}
                          benchmark="Many stocks trade at 4.5-6.5%"
                        />
                        <MetricRow
                          metric="Next Year Rev Growth"
                          value={formatPercentage(metrics.Next_Year_Revenue_Growth)}
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
                    <table id="search-margins-ratios-table" className="w-full">
                      <tbody>
                        <MetricRow
                          metric="Gross Margin"
                          value={formatPercentage(metrics.Gross_Margin && metrics.Gross_Margin * 100)}
                          benchmark="Many stocks trade at 40-48%"
                        />
                        <MetricRow
                          metric="Net Margin"
                          value={formatPercentage(metrics.Net_Margin && metrics.Net_Margin * 100)}
                          benchmark="Many stocks trade at 8-10%"
                        />
                        <MetricRow
                          metric="TTM P/S Ratio"
                          value={formatRatio(metrics.TTM_PS_Ratio)}
                          benchmark="Many stocks trade at 1.8-2.6"
                        />
                        <MetricRow
                          metric="Forward P/S Ratio"
                          value={formatRatio(metrics.Forward_PS_Ratio)}
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
      </main>
    </>
  );
}