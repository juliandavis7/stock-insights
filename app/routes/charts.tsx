import { useState, useEffect } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Navbar } from "~/components/homepage/navbar";
import { StockSearchHeader } from "~/components/stock-search-header";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { useChartsState, useStockActions } from "~/store/stockStore";
import type { Route } from "./+types/charts";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Charts - Stock Insights" },
    { name: "description", content: "Financial charts and visualizations" },
  ];
}

export async function loader() {
  return {
    isSignedIn: false,
    hasActiveSubscription: false,
  };
}

export default function ChartsPage({ loaderData }: Route.ComponentProps) {
  const [ticker, setTicker] = useState("AAPL");
  const [viewMode, setViewMode] = useState<"quarterly" | "ttm">("quarterly");
  const charts = useChartsState();
  const actions = useStockActions();

  // Auto-load AAPL on page mount
  useEffect(() => {
    if (ticker === "AAPL") {
      const upperTicker = ticker.toUpperCase();
      actions.setChartsTicker(upperTicker);
      actions.setChartsLoading(true);
      actions.setChartsError(null);

      actions.fetchCharts(upperTicker).then(data => {
        actions.setChartsData(data);
      }).catch(err => {
        actions.setChartsError(err instanceof Error ? err.message : "An error occurred");
      }).finally(() => {
        actions.setChartsLoading(false);
      });
    }
  }, []); // Empty dependency array since we only want this to run once on mount

  // Get year range for the sticky header
  const getYearRange = () => {
    if (!charts.data || !charts.data.quarters.length) {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    }
    
    const years = charts.data.quarters.map(q => parseInt(q.split(' ')[0]));
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    
    // Create range from min to max year
    const yearRange = [];
    for (let year = minYear; year <= maxYear; year++) {
      yearRange.push(year);
    }
    return yearRange;
  };

  // Format data for Recharts with simplified quarter labels
  const formatChartData = (data: any) => {
    return data.quarters.map((quarter: string, index: number) => {
      // Extract just the quarter part (Q1, Q2, etc.)
      const quarterOnly = quarter.split(' ')[1] || quarter;
      
      return {
        quarter: quarterOnly,
        fullQuarter: quarter, // Keep full quarter for tooltips
        revenue: data.revenue[index],
        eps: data.eps[index],
      };
    });
  };

  // Get years for the quarter data to calculate positions
  const getQuartersPerYear = () => {
    if (!charts.data || !charts.data.quarters.length) return {};
    
    const quartersByYear: { [year: string]: number } = {};
    charts.data.quarters.forEach(quarter => {
      const year = quarter.split(' ')[0];
      quartersByYear[year] = (quartersByYear[year] || 0) + 1;
    });
    
    return quartersByYear;
  };

  const handleSearch = async () => {
    if (!ticker.trim()) {
      actions.setChartsError("Please enter a ticker symbol");
      return;
    }

    const upperTicker = ticker.toUpperCase();
    actions.setChartsTicker(upperTicker);
    actions.setChartsLoading(true);
    actions.setChartsError(null);

    try {
      const data = await actions.fetchCharts(upperTicker);
      actions.setChartsData(data);
    } catch (err) {
      actions.setChartsError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      actions.setChartsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "$0";
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "0";
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    } else {
      return value.toFixed(0);
    }
  };

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    eps: {
      label: "EPS",
      color: "hsl(var(--chart-2))",
    },
  };

  const yearRange = getYearRange();

  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="w-full max-w-6xl mx-auto">
            {/* Stock Search Header */}
            <StockSearchHeader
              stockSymbol={ticker}
              onStockSymbolChange={setTicker}
              onSearch={handleSearch}
              loading={charts.loading}
              ticker={charts.data?.ticker}
              stockPrice={charts.data?.price}
              marketCap={charts.data?.market_cap}
              formatCurrency={formatCurrency}
              formatNumber={formatNumber}
            />
            
            {charts.error && (
              <div className="text-red-500 text-center mt-4 p-4 bg-red-50 rounded-lg max-w-md mx-auto">
                {charts.error}
              </div>
            )}

            {/* Sticky Year Headers */}
            {charts.data && !charts.loading && (
              <div className="sticky top-20 z-50 bg-background shadow-sm border-b pt-6 pb-4">
                <div className="w-full max-w-6xl mx-auto px-6">
                  <div className="flex justify-between items-center">
                    {(() => {
                      const yearGroups: { [year: string]: number } = {};
                      charts.data.quarters.forEach(quarter => {
                        const year = quarter.split(' ')[0];
                        yearGroups[year] = (yearGroups[year] || 0) + 1;
                      });
                      
                      return Object.entries(yearGroups).map(([year, quarterCount], index) => (
                        <div key={year} className="flex-1 text-center">
                          <div className="text-lg font-semibold text-gray-700">
                            {year}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* View Mode Toggle */}
            {charts.data && !charts.loading && (
              <div className="flex justify-center mb-6">
                <ToggleGroup 
                  type="single" 
                  value={viewMode} 
                  onValueChange={(value) => value && setViewMode(value as "quarterly" | "ttm")}
                  className="bg-gray-100"
                >
                  <ToggleGroupItem value="quarterly" className="px-4 py-2">
                    Quarterly
                  </ToggleGroupItem>
                  <ToggleGroupItem value="ttm" className="px-4 py-2">
                    TTM
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            {/* Loading State */}
            {charts.loading && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts Section */}
            {charts.data && !charts.loading && (
              <div className="space-y-6">
                {/* Revenue Chart */}
                <Card id="revenue-chart-container">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Quarterly Revenue ({charts.data.ticker})</h2>
                    <ChartContainer config={chartConfig} className="min-h-[300px]">
                      <BarChart data={formatChartData(charts.data)} margin={{ left: 20, right: 20, top: 20, bottom: 60 }}>
                        <XAxis 
                          dataKey="quarter" 
                          tick={{ fontSize: 12 }}
                          axisLine={true}
                          tickLine={true}
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          labelFormatter={(label, payload) => {
                            const fullQuarter = payload?.[0]?.payload?.fullQuarter || label;
                            return `Quarter: ${fullQuarter}`;
                          }}
                          formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="var(--color-revenue)"
                          radius={[4, 4, 0, 0]}
                        />
                        
                        {/* Year boundary reference lines */}
                        {charts.data.quarters.map((quarter, index) => {
                          const quarterNum = quarter.split(' ')[1];
                          const currentYear = quarter.split(' ')[0];
                          const nextQuarter = charts.data.quarters[index + 1];
                          
                          if (quarterNum === 'Q4' && index < charts.data.quarters.length - 1 && nextQuarter) {
                            const nextYear = nextQuarter.split(' ')[0];
                            const isYearTransition = currentYear !== nextYear;
                            
                            return (
                              <ReferenceLine
                                key={`year-line-${index}`}
                                x={index + 0.5}
                                stroke={isYearTransition ? "#333" : "#666"}
                                strokeWidth={isYearTransition ? 3 : 2}
                                strokeDasharray="none"
                              />
                            );
                          }
                          return null;
                        })}
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* EPS Chart */}
                <Card id="net-income-chart-container">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Quarterly Earnings Per Share ({charts.data.ticker})</h2>
                    <ChartContainer config={chartConfig} className="min-h-[300px]">
                      <BarChart data={formatChartData(charts.data)} margin={{ left: 20, right: 20, top: 20, bottom: 60 }}>
                        <XAxis 
                          dataKey="quarter"
                          tick={{ fontSize: 12 }}
                          axisLine={true}
                          tickLine={true}
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          labelFormatter={(label, payload) => {
                            const fullQuarter = payload?.[0]?.payload?.fullQuarter || label;
                            return `Quarter: ${fullQuarter}`;
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "EPS"]}
                        />
                        <Bar 
                          dataKey="eps" 
                          fill="var(--color-eps)"
                          radius={[4, 4, 0, 0]}
                        />
                        
                        {/* Year boundary reference lines */}
                        {charts.data.quarters.map((quarter, index) => {
                          const quarterNum = quarter.split(' ')[1];
                          const currentYear = quarter.split(' ')[0];
                          const nextQuarter = charts.data.quarters[index + 1];
                          
                          if (quarterNum === 'Q4' && index < charts.data.quarters.length - 1 && nextQuarter) {
                            const nextYear = nextQuarter.split(' ')[0];
                            const isYearTransition = currentYear !== nextYear;
                            
                            return (
                              <ReferenceLine
                                key={`year-line-${index}`}
                                x={index + 0.5}
                                stroke={isYearTransition ? "#333" : "#666"}
                                strokeWidth={isYearTransition ? 3 : 2}
                                strokeDasharray="none"
                              />
                            );
                          }
                          return null;
                        })}
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Empty State */}
            {!charts.data && !charts.loading && !charts.error && (
              <div className="text-center text-gray-500 mt-12">
                <p className="text-lg">Enter a ticker symbol above to view financial charts</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}