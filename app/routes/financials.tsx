import { useState, useEffect } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Search } from "lucide-react";
import { Navbar } from "~/components/homepage/navbar";
import { useFinancialsState, useStockActions } from "~/store/stockStore";
import type { Route } from "./+types/financials";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Financial Statements - Stock Insights" },
    { name: "description", content: "View detailed financial statements and ratios" },
  ];
}

export async function loader() {
  return {
    isSignedIn: false,
    hasActiveSubscription: false,
  };
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

// Utility functions as per documentation
const formatLargeNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const formatEPS = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "";
  return `$${value.toFixed(2)}`;
};

const calculateYoYGrowth = (current: number | null, previous: number | null): { text: string; color: string } => {
  if (!current || !previous || previous === 0) return { text: "", color: "" };
  const growth = ((current - previous) / Math.abs(previous)) * 100;
  const isPositive = growth > 0;
  return {
    text: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
    color: isPositive ? "text-green-600" : "text-red-600"
  };
};

interface MetricRowProps {
  metricName: string;
  data: FinancialsData;
  allYears: string[];
  getHistoricalValue: (year: string) => number | null;
  getEstimateValue: (year: string) => number | null;
  formatter: (value: number | null) => string;
}

const MetricRow = ({ metricName, data, allYears, getHistoricalValue, getEstimateValue, formatter }: MetricRowProps) => {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-4 px-6 font-semibold text-gray-900">{metricName}</td>
      {allYears.map((year, index) => {
        const historical = data.historical.find(h => h.fiscalYear === year);
        const estimate = data.estimates.find(e => e.fiscalYear === year);
        const value = getHistoricalValue(year) ?? getEstimateValue(year);
        
        // Calculate growth rate compared to previous year
        let growth = null;
        if (index > 0) {
          const prevYear = allYears[index - 1];
          const prevHistorical = data.historical.find(h => h.fiscalYear === prevYear);
          const prevEstimate = data.estimates.find(e => e.fiscalYear === prevYear);
          const prevValue = getHistoricalValue(prevYear) ?? getEstimateValue(prevYear);
          
          if (value && prevValue) {
            growth = calculateYoYGrowth(value, prevValue);
          }
        }
        
        return (
          <td key={year} className="py-4 px-6 text-left">
            <div className="flex items-center gap-3">
              <div className="font-medium text-gray-900">
                {formatter(value)}
              </div>
              {growth && growth.text && (
                <div className={`text-xs ${growth.color} whitespace-nowrap`}>
                  {growth.text}
                </div>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
};

export default function Financials({ loaderData }: Route.ComponentProps) {
  const financialsState = useFinancialsState();
  const actions = useStockActions();
  const [stockSymbol, setStockSymbol] = useState(financialsState?.currentTicker || 'AAPL');

  const fetchFinancials = async (symbol: string) => {  
    actions.setFinancialsLoading(true);
    actions.setFinancialsError(null);
    actions.setFinancialsTicker(symbol);
    
    try {
      // Check cache first, then fetch if needed
      const cachedData = actions.getCachedFinancials(symbol);
      if (cachedData) {
        actions.setFinancialsData(cachedData);
        actions.setFinancialsLoading(false);
        return;
      }
      
      const data = await actions.fetchFinancials(symbol);
      actions.setFinancialsData(data);
    } catch (err) {
      console.error("Error fetching financials:", err);
      actions.setFinancialsError(err instanceof Error ? err.message : "Error fetching financial data");
    } finally {
      actions.setFinancialsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (stockSymbol.trim()) {
      fetchFinancials(stockSymbol.trim().toUpperCase());
    }
  };

  // Auto-load AAPL data on component mount
  useEffect(() => {
    fetchFinancials('AAPL');
  }, []);

  // Sync input field when returning to tab with different ticker
  useEffect(() => {
    if (financialsState?.currentTicker && financialsState.currentTicker !== stockSymbol) {
      setStockSymbol(financialsState.currentTicker);
    }
  }, [financialsState?.currentTicker]);

  const data = financialsState?.data;
  const loading = financialsState?.loading || false;
  const error = financialsState?.error;

  // Get years for table headers (2022-2027) - sorted chronologically
  const historicalYears = data?.historical?.map(h => h.fiscalYear).filter(year => parseInt(year) >= 2022).sort() || [];
  const estimateYears = data?.estimates?.map(e => e.fiscalYear).filter(year => parseInt(year) >= 2022).sort() || [];
  const allYears = [...historicalYears, ...estimateYears].filter((year, index, arr) => arr.indexOf(year) === index).sort();

  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="w-full max-w-7xl mx-auto">
            
            {/* Stock Selection Section - Following documentation layout */}
            <div id="financials-stock-selection-container" className="sticky top-20 z-10 mb-6">
              <Card>
                <CardContent>
                  <div id="financials-stock-input-row" className="flex gap-2 max-w-xs mx-auto">
                    <div className="w-32">
                      <Label htmlFor="financials-stock-input" className="sr-only">
                        Stock Symbol
                      </Label>
                      <Input
                        id="financials-stock-input"
                        placeholder="Enter ticker (e.g., PYPL)"
                        value={stockSymbol}
                        onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                      />
                    </div>
                    <Button id="financials-submit-button" type="submit" disabled={loading} onClick={handleSearch}>
                      <Search className="h-4 w-4 mr-2" />
                      Get Financials
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stock Info Header */}
            {data && (
              <div id="financials-stock-info-header" className="mb-6">  
                <div className="text-center">
                  <h1 id="financials-ticker-display" className="text-2xl font-bold text-gray-900 mb-2">
                    {data.ticker}
                  </h1>
                  <div id="financials-stock-metrics" className="space-x-6 text-sm text-gray-600">
                    <span id="stock-price">
                      STOCK PRICE: {formatLargeNumber(data.price)}
                    </span>
                    <span id="market-cap">
                      MKT.CAP: {formatLargeNumber(data.market_cap)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="mb-6">
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
            ) : data && (
              /* Financial Metrics Table */
              <Card>
                <CardContent className="pt-6">
                  <div id="financials-metrics-table" className="overflow-x-auto">
                    <table className="w-full">
                      {/* Table Header */}
                      <thead>
                        <tr id="financials-table-header" className="border-b border-gray-200">
                          <th id="metric-column" className="py-4 px-6 text-left font-bold text-gray-900 text-base uppercase tracking-wider">
                            METRIC
                          </th>
                          {allYears.map(year => (
                            <th key={year} id={`year-${year}`} className="py-4 px-6 text-center font-bold text-base min-w-[140px] align-top">
                              <div className={estimateYears.includes(year) ? "text-blue-600" : "text-gray-900"}>
                                {year}
                              </div>
                              <div className="h-5 flex items-center justify-center">
                                {estimateYears.includes(year) && (
                                  <span className="text-xs text-blue-600 font-semibold">EST</span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody id="financials-table-sections">
                        {/* Revenue & Profitability Section */}
                        <tr className="bg-gray-50">
                          <td colSpan={allYears.length + 1} className="py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">
                            REVENUE & PROFITABILITY
                          </td>
                        </tr>

                        <MetricRow
                          metricName="TOTAL REVENUE"
                          data={data}
                          allYears={allYears}
                          getHistoricalValue={(year) => data.historical.find(h => h.fiscalYear === year)?.totalRevenue || null}
                          getEstimateValue={(year) => data.estimates.find(e => e.fiscalYear === year)?.totalRevenue || null}
                          formatter={formatLargeNumber}
                        />

                        <MetricRow
                          metricName="COST OF REVENUE"
                          data={data}
                          allYears={allYears}
                          getHistoricalValue={(year) => data.historical.find(h => h.fiscalYear === year)?.costOfRevenue || null}
                          getEstimateValue={() => null}
                          formatter={formatLargeNumber}
                        />

                        <MetricRow
                          metricName="GROSS PROFIT"
                          data={data}
                          allYears={allYears}
                          getHistoricalValue={(year) => data.historical.find(h => h.fiscalYear === year)?.grossProfit || null}
                          getEstimateValue={() => null}
                          formatter={formatLargeNumber}
                        />

                        {/* Operating Expenses (OPEX) Section */}
                        <tr className="bg-gray-50">
                          <td colSpan={allYears.length + 1} className="py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">
                            OPERATING EXPENSES (OPEX)
                          </td>
                        </tr>

                        <MetricRow
                          metricName="SG&A"
                          data={data}
                          allYears={allYears}
                          getHistoricalValue={(year) => data.historical.find(h => h.fiscalYear === year)?.sellingGeneralAndAdministrative || null}
                          getEstimateValue={() => null}
                          formatter={formatLargeNumber}
                        />

                        <MetricRow
                          metricName="R&D"
                          data={data}
                          allYears={allYears}
                          getHistoricalValue={(year) => data.historical.find(h => h.fiscalYear === year)?.researchAndDevelopment || null}
                          getEstimateValue={() => null}
                          formatter={formatLargeNumber}
                        />

                        <MetricRow
                          metricName="TOTAL OPEX"
                          data={data}
                          allYears={allYears}
                          getHistoricalValue={(year) => data.historical.find(h => h.fiscalYear === year)?.operatingExpenses || null}
                          getEstimateValue={() => null}
                          formatter={formatLargeNumber}
                        />

                        <MetricRow
                          metricName="OPERATING INCOME"
                          data={data}
                          allYears={allYears}
                          getHistoricalValue={(year) => data.historical.find(h => h.fiscalYear === year)?.operatingIncome || null}
                          getEstimateValue={() => null}
                          formatter={formatLargeNumber}
                        />

                        {/* Net Income & EPS Section */}
                        <tr className="bg-gray-50">
                          <td colSpan={allYears.length + 1} className="py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">
                            NET INCOME & EPS
                          </td>
                        </tr>

                        <MetricRow
                          metricName="NET INCOME"
                          data={data}
                          allYears={allYears}
                          getHistoricalValue={(year) => data.historical.find(h => h.fiscalYear === year)?.netIncome || null}
                          getEstimateValue={(year) => data.estimates.find(e => e.fiscalYear === year)?.netIncome || null}
                          formatter={formatLargeNumber}
                        />

                        <MetricRow
                          metricName="BASIC EPS"
                          data={data}
                          allYears={allYears}
                          getHistoricalValue={(year) => data.historical.find(h => h.fiscalYear === year)?.eps || null}
                          getEstimateValue={(year) => data.estimates.find(e => e.fiscalYear === year)?.eps || null}
                          formatter={formatEPS}
                        />

                        <MetricRow
                          metricName="DILUTED EPS"
                          data={data}
                          allYears={allYears}
                          getHistoricalValue={(year) => data.historical.find(h => h.fiscalYear === year)?.dilutedEps || null}
                          getEstimateValue={(year) => data.estimates.find(e => e.fiscalYear === year)?.dilutedEps || null}
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
    </>
  );
}