import { useState, useEffect } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Navbar } from "~/components/homepage/navbar";
import { StockSearchHeader } from "~/components/stock-search-header";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ReferenceLine, Legend, Cell } from "recharts";
import { useChartsState, useStockActions, useGlobalTicker, useStockInfo } from "~/store/stockStore";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import type { Route } from "./+types/charts";
import { BRAND_NAME } from "~/config/brand";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Charts - ${BRAND_NAME}` },
    { name: "description", content: "Financial charts and visualizations" },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  
  // Redirect to sign-in if not authenticated
  if (!userId) {
    throw redirect("/sign-in");
  }

  return {
    isSignedIn: true,
    hasActiveSubscription: true, // You can add subscription check logic here
    userId
  };
}

export default function ChartsPage({ loaderData }: Route.ComponentProps) {
  const [ticker, setTicker] = useState("");
  const charts = useChartsState();
  const globalTicker = useGlobalTicker();
  const stockInfo = useStockInfo();
  const actions = useStockActions();
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  // Chart height constant - adjust this value to change all chart heights
  const CHART_HEIGHT = "min-h-65";
  
  // Use viewMode from global state instead of local state
  const viewMode = charts.viewMode;

  // Initialize ticker from global state
  useEffect(() => {
    const initialTicker = globalTicker.currentTicker || "AAPL";
    setTicker(initialTicker);
  }, []);

  // Sync ticker input with global ticker changes
  useEffect(() => {
    if (globalTicker.currentTicker && globalTicker.currentTicker !== ticker) {
      setTicker(globalTicker.currentTicker);
    }
  }, [globalTicker.currentTicker]);

  // Load data when global ticker or view mode changes
  useEffect(() => {
    const tickerToLoad = globalTicker.currentTicker || "AAPL";
    if (tickerToLoad) {
      const upperTicker = tickerToLoad.toUpperCase();
      actions.setChartsLoading(true);
      actions.setChartsError(null);
      actions.setStockInfoLoading(true);

      // Fetch both charts data and stock info concurrently
      Promise.allSettled([
        actions.fetchCharts(upperTicker, viewMode, authenticatedFetch),
        actions.fetchStockInfo(upperTicker, authenticatedFetch)
      ]).then(([chartsPromise, stockInfoPromise]) => {
        // Handle charts result
        if (chartsPromise.status === 'fulfilled') {
          actions.setChartsData(chartsPromise.value);
        } else {
          console.error("Error fetching charts:", chartsPromise.reason);
          const errorMessage = chartsPromise.reason instanceof Error ? chartsPromise.reason.message : "An error occurred";
          actions.setChartsError(errorMessage);
          
          // If ticker not found, set empty chart data to show axes without bars
          if (errorMessage.toLowerCase().includes('not found') || 
              errorMessage.toLowerCase().includes('404') ||
              errorMessage.toLowerCase().includes('does not exist') ||
              errorMessage.toLowerCase().includes('failed to fetch charts for')) {
            actions.setChartsData({
              ticker: upperTicker,
              quarters: [],
              revenue: [],
              eps: [],
              gross_margin: [],
              net_margin: [],
              operating_income: [],
              free_cash_flow: [],
              operating_cash_flow: []
            });
          }
        }
        
        // Stock info is automatically handled by the fetchStockInfo action
        if (stockInfoPromise.status === 'rejected') {
          console.error("Error fetching stock info:", stockInfoPromise.reason);
          actions.setStockInfoError(stockInfoPromise.reason instanceof Error ? stockInfoPromise.reason.message : "Error fetching stock info");
        }
      }).finally(() => {
        actions.setChartsLoading(false);
        actions.setStockInfoLoading(false);
      });
    }
  }, [globalTicker.currentTicker, viewMode]); // Depend on both global ticker and view mode changes

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

  // Get the index of the most recent quarter with actual data (not projected)
  const getMostRecentActualQuarterIndex = (data: any) => {
    if (!data || !data.quarters) return -1;
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-based
    
    // Determine current quarter
    const currentQuarter = Math.ceil(currentMonth / 3);
    
    // Find the most recent quarter that should have actual data (previous quarter, not current)
    // Companies typically report quarterly data 1-2 months after quarter end
    for (let i = data.quarters.length - 1; i >= 0; i--) {
      const quarter = data.quarters[i];
      const [year, q] = quarter.split(' ');
      const quarterNum = parseInt(q.replace('Q', ''));
      const quarterYear = parseInt(year);
      
      // Only previous quarters should have actual data, not current quarter
      if (quarterYear < currentYear || (quarterYear === currentYear && quarterNum < currentQuarter)) {
        return i;
      }
    }
    
    return -1;
  };

  // Check if a quarter is in the future (projected data)
  const isQuarterFuture = (quarter: string) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-based
    const currentQuarter = Math.ceil(currentMonth / 3);
    
    const [year, q] = quarter.split(' ');
    const quarterNum = parseInt(q.replace('Q', ''));
    const quarterYear = parseInt(year);
    
    // Current quarter and beyond are considered future/projected since earnings haven't been reported yet
    return quarterYear > currentYear || (quarterYear === currentYear && quarterNum >= currentQuarter);
  };

  // Detect if chart has future data
  const chartHasFutureData = (data: any) => {
    if (!data || !data.quarters) return false;
    return data.quarters.some((quarter: string) => isQuarterFuture(quarter));
  };

  // Format data for Recharts with simplified quarter labels
  const formatChartData = (data: any) => {
    // If no quarters data, return placeholder data to show empty chart with axes
    if (!data || !data.quarters || data.quarters.length === 0) {
      // Create placeholder data for 5 years of quarters
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
      const placeholderData: any[] = [];
      
      years.forEach(year => {
        for (let q = 1; q <= 4; q++) {
          placeholderData.push({
            quarter: `Q${q}`,
            fullQuarter: `${year} Q${q}`,
            revenue: null,
            eps: null,
            isLastActual: false,
            isFuture: false,
            hasFutureData: false,
          });
        }
      });
      
      return placeholderData;
    }
    
    const mostRecentActualIndex = getMostRecentActualQuarterIndex(data);
    const hasFutureData = chartHasFutureData(data);
    
    return data.quarters.map((quarter: string, index: number) => {
      // Extract just the quarter part (Q1, Q2, etc.)
      const quarterOnly = quarter.split(' ')[1] || quarter;
      const isFuture = isQuarterFuture(quarter);
      
      return {
        quarter: quarterOnly,
        fullQuarter: quarter, // Keep full quarter for tooltips
        revenue: data.revenue[index],
        eps: data.eps[index],
        isLastActual: index === mostRecentActualIndex,
        isFuture: isFuture,
        hasFutureData: hasFutureData,
      };
    });
  };

  // Format margin data for line chart (keep all quarters, null values create gaps)
  const formatMarginData = (data: any) => {
    // If no quarters data, return placeholder data to show empty chart with axes
    if (!data || !data.quarters || data.quarters.length === 0) {
      // Create placeholder data for 5 years of quarters
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
      const placeholderData: any[] = [];
      
      years.forEach(year => {
        for (let q = 1; q <= 4; q++) {
          placeholderData.push({
            quarter: `Q${q}`,
            fullQuarter: `${year} Q${q}`,
            grossMargin: null,
            netMargin: null,
            isLastActual: false,
          });
        }
      });
      
      return placeholderData;
    }
    
    const mostRecentActualIndex = getMostRecentActualQuarterIndex(data);
    
    return data.quarters.map((quarter: string, index: number) => {
      const quarterOnly = quarter.split(' ')[1] || quarter;
      const grossMargin = data.gross_margin[index];
      const netMargin = data.net_margin[index];
      
      return {
        quarter: quarterOnly,
        fullQuarter: quarter,
        grossMargin: grossMargin, // Keep null values - they create gaps in line charts
        netMargin: netMargin,     // Keep null values - they create gaps in line charts
        isLastActual: index === mostRecentActualIndex,
      };
    });
  };

  // Format operating income data for bar chart (keep all quarters, null values won't render bars)
  const formatOperatingIncomeData = (data: any) => {
    // If no quarters data, return placeholder data to show empty chart with axes
    if (!data || !data.quarters || data.quarters.length === 0) {
      // Create placeholder data for 5 years of quarters
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
      const placeholderData: any[] = [];
      
      years.forEach(year => {
        for (let q = 1; q <= 4; q++) {
          placeholderData.push({
            quarter: `Q${q}`,
            fullQuarter: `${year} Q${q}`,
            operatingIncome: null,
            isLastActual: false,
          });
        }
      });
      
      return placeholderData;
    }
    
    const mostRecentActualIndex = getMostRecentActualQuarterIndex(data);
    
    return data.quarters.map((quarter: string, index: number) => {
      const quarterOnly = quarter.split(' ')[1] || quarter;
      const operatingIncome = data.operating_income[index];
      
      return {
        quarter: quarterOnly,
        fullQuarter: quarter,
        operatingIncome: operatingIncome, // Keep null values - they won't render as bars
        isLastActual: index === mostRecentActualIndex,
      };
    });
  };

  // Format free cash flow data for bar chart (keep all quarters, null values won't render bars)
  const formatFreeCashFlowData = (data: any) => {
    // If no quarters data, return placeholder data to show empty chart with axes
    if (!data || !data.quarters || data.quarters.length === 0) {
      // Create placeholder data for 5 years of quarters
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
      const placeholderData: any[] = [];
      
      years.forEach(year => {
        for (let q = 1; q <= 4; q++) {
          placeholderData.push({
            quarter: `Q${q}`,
            fullQuarter: `${year} Q${q}`,
            freeCashFlow: null,
            isLastActual: false,
          });
        }
      });
      
      return placeholderData;
    }
    
    const mostRecentActualIndex = getMostRecentActualQuarterIndex(data);
    
    return data.quarters.map((quarter: string, index: number) => {
      const quarterOnly = quarter.split(' ')[1] || quarter;
      const freeCashFlow = data.free_cash_flow[index];
      
      return {
        quarter: quarterOnly,
        fullQuarter: quarter,
        freeCashFlow: freeCashFlow, // Keep null values - they won't render as bars
        isLastActual: index === mostRecentActualIndex,
      };
    });
  };

  // Format operating cash flow data for bar chart (keep all quarters, null values won't render bars)
  const formatOperatingCashFlowData = (data: any) => {
    // If no quarters data, return placeholder data to show empty chart with axes
    if (!data || !data.quarters || data.quarters.length === 0) {
      // Create placeholder data for 5 years of quarters
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
      const placeholderData: any[] = [];
      
      years.forEach(year => {
        for (let q = 1; q <= 4; q++) {
          placeholderData.push({
            quarter: `Q${q}`,
            fullQuarter: `${year} Q${q}`,
            operatingCashFlow: null,
            isLastActual: false,
          });
        }
      });
      
      return placeholderData;
    }
    
    const mostRecentActualIndex = getMostRecentActualQuarterIndex(data);
    
    return data.quarters.map((quarter: string, index: number) => {
      const quarterOnly = quarter.split(' ')[1] || quarter;
      const operatingCashFlow = data.operating_cash_flow[index];
      
      return {
        quarter: quarterOnly,
        fullQuarter: quarter,
        operatingCashFlow: operatingCashFlow, // Keep null values - they won't render as bars
        isLastActual: index === mostRecentActualIndex,
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
    actions.setGlobalTicker(upperTicker); // Set global ticker
    actions.setChartsLoading(true);
    actions.setChartsError(null);
    actions.setStockInfoLoading(true);

    try {
      // Fetch both charts data and stock info concurrently
      const [chartsPromise, stockInfoPromise] = await Promise.allSettled([
        actions.fetchCharts(upperTicker, viewMode),
        actions.fetchStockInfo(upperTicker)
      ]);
      
      // Handle charts result
      if (chartsPromise.status === 'fulfilled') {
        actions.setChartsData(chartsPromise.value);
      } else {
        console.error("Error fetching charts:", chartsPromise.reason);
        const errorMessage = chartsPromise.reason instanceof Error ? chartsPromise.reason.message : "An error occurred";
        actions.setChartsError(errorMessage);
        
        // If ticker not found, set empty chart data to show axes without bars
        if (errorMessage.toLowerCase().includes('not found') || 
            errorMessage.toLowerCase().includes('404') ||
            errorMessage.toLowerCase().includes('does not exist') ||
            errorMessage.toLowerCase().includes('failed to fetch charts for')) {
          actions.setChartsData({
            ticker: upperTicker,
            quarters: [],
            revenue: [],
            eps: [],
            gross_margin: [],
            net_margin: [],
            operating_income: [],
            free_cash_flow: [],
            operating_cash_flow: []
          });
        }
      }
      
      // Stock info is automatically handled by the fetchStockInfo action
      if (stockInfoPromise.status === 'rejected') {
        console.error("Error fetching stock info:", stockInfoPromise.reason);
        actions.setStockInfoError(stockInfoPromise.reason instanceof Error ? stockInfoPromise.reason.message : "Error fetching stock info");
      }
      
    } catch (err) {
      console.error("Unexpected error:", err);
      actions.setChartsError(err instanceof Error ? err.message : "Unexpected error occurred");
      actions.setStockInfoError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      actions.setChartsLoading(false);
      actions.setStockInfoLoading(false);
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

  const formatNumberInteger = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "0";
    
    // Handle negative values
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    
    let formattedValue: string;
    if (absValue >= 1e9) {
      formattedValue = `${Math.round(absValue / 1e9)}B`;
    } else if (absValue >= 1e6) {
      formattedValue = `${Math.round(absValue / 1e6)}M`;
    } else if (absValue >= 1e3) {
      formattedValue = `${Math.round(absValue / 1e3)}K`;
    } else {
      formattedValue = Math.round(absValue).toString();
    }
    
    return isNegative ? `-${formattedValue}` : formattedValue;
  };

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "#F59E0B",
    },
    eps: {
      label: "EPS",
      color: "#F59E0B",
    },
    grossMargin: {
      label: "Gross Margin",
      color: "#E879F9",
    },
    netMargin: {
      label: "Net Margin", 
      color: "#22D3EE",
    },
    freeCashFlow: {
      label: "Free Cash Flow",
      color: "#F59E0B",
    },
    operatingCashFlow: {
      label: "Operating Cash Flow",
      color: "#F59E0B",
    },
    operatingIncome: {
      label: "Operating Income",
      color: "#F59E0B",
    },
  };

  const yearRange = getYearRange();

  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-page-background">
        <div className="container mx-auto px-6 py-8">
          <div className="w-full max-w-6xl mx-auto">
            {/* Sticky Header Section */}
            <div className="sticky top-22 z-50 bg-page-background pb-4">
              {/* Stock Search Header */}
              <StockSearchHeader
                stockSymbol={ticker}
                onStockSymbolChange={setTicker}
                onSearch={handleSearch}
                loading={charts.loading || stockInfo.loading}
                ticker={stockInfo.data?.ticker}
                stockPrice={stockInfo.data?.price}
                marketCap={stockInfo.data?.market_cap}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                error={stockInfo.error}
              />
              
              {/* Error State - Only show non-404 errors */}
              {((charts.error && !(
                charts.error.toLowerCase().includes('not found') || 
                charts.error.toLowerCase().includes('404') ||
                charts.error.toLowerCase().includes('does not exist') ||
                charts.error.toLowerCase().includes('failed to fetch charts for')
              )) || (stockInfo.error && !(
                stockInfo.error.toLowerCase().includes('not found') || 
                stockInfo.error.toLowerCase().includes('404') ||
                stockInfo.error.toLowerCase().includes('does not exist')
              ))) && (
                <div className="text-red-500 text-center mt-4 p-4 bg-red-50 rounded-lg max-w-md mx-auto">
                  {charts.error && !(
                    charts.error.toLowerCase().includes('not found') || 
                    charts.error.toLowerCase().includes('404') ||
                    charts.error.toLowerCase().includes('does not exist') ||
                    charts.error.toLowerCase().includes('failed to fetch charts for')
                  ) && <div>{charts.error}</div>}
                  {stockInfo.error && !(
                    stockInfo.error.toLowerCase().includes('not found') || 
                    stockInfo.error.toLowerCase().includes('404') ||
                    stockInfo.error.toLowerCase().includes('does not exist')
                  ) && <div>{stockInfo.error}</div>}
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex justify-center mt-6">
                <ToggleGroup 
                  type="single" 
                  value={viewMode} 
                  onValueChange={(value) => value && actions.setChartsViewMode(value as "quarterly" | "ttm")}
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

              {/* Year Headers */}
              {charts.data && !charts.loading && (
                <div className="pt-6">
                  <div className="w-full max-w-6xl mx-auto px-6">
                    <div className="flex justify-between items-center">
                      {(() => {
                        // If no quarters data, show default year range
                        if (!charts.data.quarters || charts.data.quarters.length === 0) {
                          const yearRange = getYearRange();
                          return yearRange.map((year) => (
                            <div key={year} className="flex-1 text-center">
                              <div className="text-lg font-semibold text-gray-700">
                                {year}
                              </div>
                            </div>
                          ));
                        }
                        
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
            </div>


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
                {/* SVG Pattern Definitions for Projected Data */}
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                  <defs>
                    <pattern 
                      id="diagonal-stripes-pattern" 
                      patternUnits="userSpaceOnUse" 
                      width="6" 
                      height="6" 
                      patternTransform="rotate(45)"
                    >
                      <rect width="6" height="6" fill="#F59E0B"/>
                      <rect width="2" height="6" fill="rgba(255,255,255,0.3)"/>
                    </pattern>
                  </defs>
                </svg>

                {/* Revenue Chart */}
                <div id="revenue-chart-container">
                    <ChartContainer config={chartConfig} className={CHART_HEIGHT}>
                      <BarChart data={formatChartData(charts.data)} margin={{ left: 20, right: 20, top: 40, bottom: 20 }} maxBarSize={40}>
                        <XAxis 
                          dataKey="quarter" 
                          tick={{ fontSize: 12 }}
                          axisLine={true}
                          tickLine={true}
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatNumberInteger(value)}
                          label={{ value: 'Revenue', angle: -90, position: 'insideLeft', textAnchor: 'middle', style: { fontSize: '16px', fontWeight: 'bold' } }}
                          domain={[0, (dataMax: number) => dataMax > 0 ? dataMax : 100]}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          labelFormatter={(label, payload) => {
                            const fullQuarter = payload?.[0]?.payload?.fullQuarter || label;
                            return `Quarter: ${fullQuarter}`;
                          }}
                          formatter={(value: number) => [formatNumber(value)]}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                        >
                          {formatChartData(charts.data).map((entry, index) => {
                            // Apply visual distinction only if chart has future data
                            if (entry.hasFutureData) {
                              const fillColor = entry.isFuture ? "url(#diagonal-stripes-pattern)" : "#F59E0B"; // Pattern for future, solid for historical
                              const fillOpacity = entry.isFuture ? 0.8 : 1; // 0.8 opacity for projected bars
                              
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={fillColor}
                                  fillOpacity={fillOpacity}
                                  style={{
                                    filter: !entry.isFuture ? "drop-shadow(1px 1px 1px rgba(0,0,0,0.1))" : "none"
                                  }}
                                />
                              );
                            } else {
                              // Fallback to current styling if no future data
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill="#F59E0B" 
                                />
                              );
                            }
                          })}
                        </Bar>
                        
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
                        
                        {/* Historical/Future data separator for Revenue */}
                        {chartHasFutureData(charts.data) && (() => {
                          const mostRecentActualIndex = getMostRecentActualQuarterIndex(charts.data);
                          if (mostRecentActualIndex >= 0 && mostRecentActualIndex < charts.data.quarters.length - 1) {
                            return (
                              <ReferenceLine
                                key="revenue-historical-future-separator"
                                x={mostRecentActualIndex + 0.5}
                                stroke="#94A3B8"
                                strokeWidth={2}
                                strokeDasharray="5,5"
                                label={{ 
                                  value: "Projections", 
                                  position: "topRight",
                                  style: { fill: "#64748B", fontSize: "12px", fontWeight: "500" }
                                }}
                              />
                            );
                          }
                          return null;
                        })()}
                      </BarChart>
                    </ChartContainer>
                </div>

                {/* Gross Margin & Net Margin Chart */}
                <div id="margin-chart-container">
                    <ChartContainer config={chartConfig} className={CHART_HEIGHT}>
                      <LineChart data={formatMarginData(charts.data)} margin={{ left: 20, right: 20, top: 60, bottom: 20 }}>
                        <XAxis 
                          dataKey="quarter" 
                          tick={{ fontSize: 12 }}
                          axisLine={true}
                          tickLine={true}
                          height={60}
                          padding={{ left: 20, right: 20 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${value}%`}
                          label={{ value: 'Margin %', angle: -90, position: 'insideLeft', textAnchor: 'middle', style: { fontSize: '16px', fontWeight: 'bold' } }}
                          domain={[0, (dataMax: number) => dataMax > 0 ? dataMax : 100]}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          labelFormatter={(label, payload) => {
                            const fullQuarter = payload?.[0]?.payload?.fullQuarter || label;
                            return `Quarter: ${fullQuarter}`;
                          }}
                          formatter={(value: number, name: string) => {
                            if (name === 'grossMargin') return [`${value}%`, 'Gross Margin'];
                            if (name === 'netMargin') return [`${value}%`, 'Net Margin'];
                            return [`${value}%`];
                          }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Line 
                          type="monotone"
                          dataKey="grossMargin" 
                          stroke="#E879F9"
                          strokeWidth={3}
                          dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            // Only render dot if the value is not null
                            if (payload.grossMargin === null || payload.grossMargin === undefined) {
                              return null;
                            }
                            return (
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r={4} 
                                fill="#E879F9" 
                                stroke={payload.isLastActual ? "#FFFFFF" : "#E879F9"} 
                                strokeWidth={payload.isLastActual ? 3 : 2} 
                              />
                            );
                          }}
                          name="Gross Margin"
                        />
                        <Line 
                          type="monotone"
                          dataKey="netMargin" 
                          stroke="#22D3EE"
                          strokeWidth={3}
                          dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            // Only render dot if the value is not null
                            if (payload.netMargin === null || payload.netMargin === undefined) {
                              return null;
                            }
                            return (
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r={4} 
                                fill="#22D3EE" 
                                stroke={payload.isLastActual ? "#FFFFFF" : "#22D3EE"} 
                                strokeWidth={payload.isLastActual ? 3 : 2} 
                              />
                            );
                          }}
                          name="Net Margin"
                        />
                      </LineChart>
                    </ChartContainer>
                </div>

                {/* EPS Chart */}
                <div id="net-income-chart-container">
                    <ChartContainer config={chartConfig} className={CHART_HEIGHT}>
                      <BarChart data={formatChartData(charts.data)} margin={{ left: 20, right: 20, top: 40, bottom: 20 }} maxBarSize={40}>
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
                          label={{ value: 'EPS', angle: -90, position: 'insideLeft', textAnchor: 'middle', style: { fontSize: '16px', fontWeight: 'bold' } }}
                          domain={[0, (dataMax: number) => dataMax > 0 ? dataMax : 10]}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          labelFormatter={(label, payload) => {
                            const fullQuarter = payload?.[0]?.payload?.fullQuarter || label;
                            return `Quarter: ${fullQuarter}`;
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`]}
                        />
                        <Bar 
                          dataKey="eps" 
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                        >
                          {formatChartData(charts.data).map((entry, index) => {
                            // Apply visual distinction only if chart has future data
                            if (entry.hasFutureData) {
                              const fillColor = entry.isFuture ? "url(#diagonal-stripes-pattern)" : "#F59E0B"; // Pattern for future, solid for historical
                              const fillOpacity = entry.isFuture ? 0.8 : 1; // 0.8 opacity for projected bars
                              
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={fillColor}
                                  fillOpacity={fillOpacity}
                                  style={{
                                    filter: !entry.isFuture ? "drop-shadow(1px 1px 1px rgba(0,0,0,0.1))" : "none"
                                  }}
                                />
                              );
                            } else {
                              // Fallback to current styling if no future data
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill="#F59E0B" 
                                />
                              );
                            }
                          })}
                        </Bar>
                        
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
                        
                        {/* Historical/Future data separator for EPS */}
                        {chartHasFutureData(charts.data) && (() => {
                          const mostRecentActualIndex = getMostRecentActualQuarterIndex(charts.data);
                          if (mostRecentActualIndex >= 0 && mostRecentActualIndex < charts.data.quarters.length - 1) {
                            return (
                              <ReferenceLine
                                key="eps-historical-future-separator"
                                x={mostRecentActualIndex + 0.5}
                                stroke="#94A3B8"
                                strokeWidth={2}
                                strokeDasharray="5,5"
                                label={{ 
                                  value: "Projections", 
                                  position: "topRight",
                                  style: { fill: "#64748B", fontSize: "12px", fontWeight: "500" }
                                }}
                              />
                            );
                          }
                          return null;
                        })()}
                      </BarChart>
                    </ChartContainer>
                </div>

                {/* Free Cash Flow Chart */}
                <div id="free-cash-flow-chart-container">
                    <ChartContainer config={chartConfig} className={CHART_HEIGHT}>
                      <BarChart data={formatFreeCashFlowData(charts.data)} margin={{ left: 20, right: 20, top: 40, bottom: 20 }} maxBarSize={40}>
                        <XAxis 
                          dataKey="quarter" 
                          tick={{ fontSize: 12 }}
                          axisLine={true}
                          tickLine={true}
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatNumberInteger(value)}
                          label={{ value: 'Free Cash Flow', angle: -90, position: 'insideLeft', textAnchor: 'middle', style: { fontSize: '16px', fontWeight: 'bold' } }}
                          domain={[0, (dataMax: number) => dataMax > 0 ? dataMax : 100]}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          labelFormatter={(label, payload) => {
                            const fullQuarter = payload?.[0]?.payload?.fullQuarter || label;
                            return `Quarter: ${fullQuarter}`;
                          }}
                          formatter={(value: number) => [formatNumber(value)]}
                        />
                        <Bar 
                          dataKey="freeCashFlow" 
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                        >
                          {formatFreeCashFlowData(charts.data).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill="#F59E0B" 
                              stroke={entry.isLastActual ? "#FFFFFF" : "none"}
                              strokeWidth={entry.isLastActual ? 3 : 0}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                </div>

                {/* Operating Cash Flow Chart */}
                <div id="operating-cash-flow-chart-container">
                    <ChartContainer config={chartConfig} className={CHART_HEIGHT}>
                      <BarChart data={formatOperatingCashFlowData(charts.data)} margin={{ left: 20, right: 20, top: 40, bottom: 20 }} maxBarSize={40}>
                        <XAxis 
                          dataKey="quarter" 
                          tick={{ fontSize: 12 }}
                          axisLine={true}
                          tickLine={true}
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatNumberInteger(value)}
                          label={{ value: 'Operating Cash Flow', angle: -90, position: 'insideLeft', textAnchor: 'middle', style: { fontSize: '16px', fontWeight: 'bold' } }}
                          domain={[0, (dataMax: number) => dataMax > 0 ? dataMax : 100]}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          labelFormatter={(label, payload) => {
                            const fullQuarter = payload?.[0]?.payload?.fullQuarter || label;
                            return `Quarter: ${fullQuarter}`;
                          }}
                          formatter={(value: number) => [formatNumber(value)]}
                        />
                        <Bar 
                          dataKey="operatingCashFlow" 
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                        >
                          {formatOperatingCashFlowData(charts.data).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill="#F59E0B" 
                              stroke={entry.isLastActual ? "#FFFFFF" : "none"}
                              strokeWidth={entry.isLastActual ? 3 : 0}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                </div>

                {/* Operating Income Chart */}
                <div id="operating-income-chart-container">
                    <ChartContainer config={chartConfig} className={CHART_HEIGHT}>
                      <BarChart data={formatOperatingIncomeData(charts.data)} margin={{ left: 20, right: 20, top: 40, bottom: 20 }} maxBarSize={40}>
                        <XAxis 
                          dataKey="quarter" 
                          tick={{ fontSize: 12 }}
                          axisLine={true}
                          tickLine={true}
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatNumberInteger(value)}
                          label={{ value: 'Operating Income', angle: -90, position: 'insideLeft', textAnchor: 'middle', style: { fontSize: '16px', fontWeight: 'bold' } }}
                          domain={[0, (dataMax: number) => dataMax > 0 ? dataMax : 100]}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          labelFormatter={(label, payload) => {
                            const fullQuarter = payload?.[0]?.payload?.fullQuarter || label;
                            return `Quarter: ${fullQuarter}`;
                          }}
                          formatter={(value: number) => [formatNumber(value)]}
                        />
                        <Bar 
                          dataKey="operatingIncome" 
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                        >
                          {formatOperatingIncomeData(charts.data).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill="#F59E0B" 
                              stroke={entry.isLastActual ? "#FFFFFF" : "none"}
                              strokeWidth={entry.isLastActual ? 3 : 0}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                </div>
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