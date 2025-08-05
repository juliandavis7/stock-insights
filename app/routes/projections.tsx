import { useState, useEffect } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Search } from "lucide-react";
import { Navbar } from "~/components/homepage/navbar";
import { useProjectionsState, useStockActions } from "~/store/stockStore";
import type { Route } from "./+types/projections";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Financial Projections - Stock Insights" },
    { name: "description", content: "Create custom financial projections for stocks" },
  ];
}

export async function loader() {
  return {
    isSignedIn: false,
    hasActiveSubscription: false,
  };
}

interface StockInfo {
  ticker: string;
  price: number | null;
  marketCap: number | null;
  sharesOutstanding: number | null;
}

interface BaseFinancialData {
  revenue: number | null;
  netIncome: number | null;
  netIncomeMargin: number | null;
  eps: number | null;
}

interface ProjectionApiResponse {
  ticker: string;
  price: number;
  market_cap: number;
  shares_outstanding: number;
  revenue: number | null;
  net_income: number | null;
  eps: number | null;
  net_income_margin: number | null;
  data_year: number;
}

interface ProjectionInputs {
  revenueGrowth: { [year: string]: number };
  netIncomeGrowth: { [year: string]: number };
  peLow: { [year: string]: number };
  peHigh: { [year: string]: number };
}

interface CalculatedProjections {
  revenue: { [year: string]: number };
  netIncome: { [year: string]: number };
  netIncomeMargin: { [year: string]: number };
  eps: { [year: string]: number };
  sharePriceLow: { [year: string]: number };
  sharePriceHigh: { [year: string]: number };
  cagrLow: { [year: string]: number };
  cagrHigh: { [year: string]: number };
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

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "0%";
  return `${value.toFixed(2)}%`;
};

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return value.toLocaleString();
};

const currentYear = new Date().getFullYear();
const projectionYears = [
  (currentYear + 1).toString(),
  (currentYear + 2).toString(),
  (currentYear + 3).toString(),
  (currentYear + 4).toString()
];

export default function ProjectionsPage({ loaderData }: Route.ComponentProps) {
  // Remove spinner arrows from number inputs
  const inputStyle = {
    MozAppearance: 'textfield' as const,
    WebkitAppearance: 'none' as const,
  };

  // Handle percentage input formatting
  const handlePercentageInputChange = (metric: 'revenueGrowth' | 'netIncomeGrowth', year: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setProjectionInputs(prev => {
      const updated = {
        ...prev,
        [metric]: {
          ...prev[metric],
          [year]: numValue
        }
      };
      
      // Trigger recalculation after state update
      setTimeout(() => recalculateProjections(updated), 0);
      
      return updated;
    });
  };

  // Handle Enter key to move to next input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, metric: string, currentYear: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentIndex = projectionYears.indexOf(currentYear);
      const nextYear = projectionYears[currentIndex + 1];
      
      if (nextYear) {
        // Focus next year for same metric
        const nextInput = document.getElementById(`${metric}-${nextYear}`);
        if (nextInput) {
          nextInput.focus();
        }
      } else {
        // If at last year, move to next metric's first year
        let nextMetric = '';
        if (metric === 'revenue-growth') {
          nextMetric = 'net-income-growth';
        } else if (metric === 'net-income-growth') {
          nextMetric = 'pe-low';
        } else if (metric === 'pe-low') {
          nextMetric = 'pe-high';
        } else if (metric === 'pe-high') {
          // After pe-high, go back to revenue-growth for next year or stop
          nextMetric = 'revenue-growth';
        }
        
        if (nextMetric) {
          const nextInput = document.getElementById(`${nextMetric}-${projectionYears[0]}`);
          if (nextInput) {
            nextInput.focus();
          }
        }
      }
    }
  };

  // Format percentage values for display
  const formatPercentageInput = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value) || value === 0) {
      return '';
    }
    return `${value}%`;
  };

  // Calculation functions
  const calculateProjectedRevenue = (previousRevenue: number, growthRate: number): number => {
    if (!previousRevenue || isNaN(previousRevenue) || !growthRate || isNaN(growthRate) || growthRate === 0) return 0;
    return previousRevenue * (1 + growthRate / 100);
  };

  const calculateNetIncomeMargin = (netIncome: number, revenue: number): number => {
    if (!netIncome || isNaN(netIncome) || !revenue || isNaN(revenue) || revenue === 0) return 0;
    return (netIncome / revenue) * 100;
  };

  const calculateNetIncomeFromGrowth = (previousNetIncome: number, growthRate: number): number => {
    if (!previousNetIncome || isNaN(previousNetIncome) || !growthRate || isNaN(growthRate) || growthRate === 0) return 0;
    return previousNetIncome * (1 + growthRate / 100);
  };

  const calculateEPS = (netIncome: number, sharesOutstanding: number): number => {
    if (!netIncome || isNaN(netIncome) || !sharesOutstanding || isNaN(sharesOutstanding) || sharesOutstanding === 0) return 0;
    return netIncome / sharesOutstanding;
  };

  const calculateStockPrice = (eps: number, peRatio: number): number => {
    if (!eps || isNaN(eps) || !peRatio || isNaN(peRatio) || peRatio === 0) return 0;
    return eps * peRatio;
  };

  const calculateCAGR = (finalValue: number, initialValue: number, years: number): number => {
    if (!finalValue || isNaN(finalValue) || !initialValue || isNaN(initialValue) || initialValue === 0 || !years || isNaN(years) || years === 0) return 0;
    return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
  };

  const calculateNetIncomeGrowthRate = (currentNetIncome: number, previousNetIncome: number): number => {
    if (!currentNetIncome || isNaN(currentNetIncome) || !previousNetIncome || isNaN(previousNetIncome) || previousNetIncome === 0) return 0;
    const growthRate = ((currentNetIncome / previousNetIncome) - 1) * 100;
    return Math.round(growthRate * 100) / 100; // Round to 2 decimal places
  };
  const projectionsState = useProjectionsState();
  const actions = useStockActions();
  const [stockSymbol, setStockSymbol] = useState(projectionsState?.currentTicker || 'AAPL');

  // Sample data for initial display
  const sampleStockInfo: StockInfo = {
    ticker: "CELH",
    price: 32.39,
    marketCap: 8.49e9,
    sharesOutstanding: 231787480
  };

  const sampleBaseData: BaseFinancialData = {
    revenue: 1.34e9,
    netIncome: 201.5e6,
    netIncomeMargin: 15.04,
    eps: 0.87
  };

  const currentYearMargin = 15.04;

  const handleTickerChange = (ticker: string) => {
    setStockSymbol(ticker.toUpperCase());
  };

  const handleProjectionInputChange = (metric: keyof ProjectionInputs, year: string, value: number) => {
    if (!projectionsState?.projectionInputs) return;
    
    const updated = {
      ...projectionsState.projectionInputs,
      [metric]: {
        ...projectionsState.projectionInputs[metric],
        [year]: value
      }
    };
    
    actions.setProjectionsInputs(updated);
    
    // Trigger recalculation after state update
    setTimeout(() => recalculateProjections(updated), 0);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stockSymbol.trim()) {
      actions.setProjectionsError("Please enter a valid ticker symbol");
      return;
    }
    
    actions.setProjectionsLoading(true);
    actions.setProjectionsError(null);
    actions.setProjectionsTicker(stockSymbol);
    
    try {
      // Check cache first, then fetch if needed
      const cachedData = actions.getCachedProjections(stockSymbol);
      if (cachedData) {
        actions.setProjectionsBaseData(cachedData);
        actions.setProjectionsLoading(false);
        
        // Clear user inputs when switching to cached ticker
        const clearedInputs = {
          revenueGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
          netIncomeGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
          peLow: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
          peHigh: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 }
        };
        actions.setProjectionsInputs(clearedInputs);
        
        // Clear calculated projections
        actions.setCalculatedProjections({
          revenue: {},
          netIncome: {},
          netIncomeMargin: {},
          eps: {},
          sharePriceLow: {},
          sharePriceHigh: {},
          cagrLow: {},
          cagrHigh: {}
        });
        return;
      }
      
      const data = await actions.fetchProjections(stockSymbol);
      actions.setProjectionsBaseData(data);
      
      // Clear all user inputs when searching for a new ticker
      const clearedInputs = {
        revenueGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
        netIncomeGrowth: { [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
        peLow: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 },
        peHigh: { [currentYear]: 0, [projectionYears[0]]: 0, [projectionYears[1]]: 0, [projectionYears[2]]: 0, [projectionYears[3]]: 0 }
      };
      actions.setProjectionsInputs(clearedInputs);
      
      // Clear calculated projections
      actions.setCalculatedProjections({
        revenue: {},
        netIncome: {},
        netIncomeMargin: {},
        eps: {},
        sharePriceLow: {},
        sharePriceHigh: {},
        cagrLow: {},
        cagrHigh: {}
      });
      
    } catch (err) {
      console.error('Error fetching stock data:', err);
      actions.setProjectionsError(err instanceof Error ? err.message : 'Failed to fetch stock data');
    } finally {
      actions.setProjectionsLoading(false);
    }
  };


  // Recalculate all projections based on current inputs
  const recalculateProjections = (inputs: ProjectionInputs) => {
    if (!projectionsState.baseData?.price || !projectionsState.baseData?.shares_outstanding || !projectionsState.baseData?.revenue || !projectionsState.baseData?.net_income) {
      return; // Wait for base data to be loaded
    }

    const newProjections: CalculatedProjections = {
      revenue: {},
      netIncome: {},
      netIncomeMargin: {},
      eps: {},
      sharePriceLow: {},
      sharePriceHigh: {},
      cagrLow: {},
      cagrHigh: {}
    };

    // Calculate current year share prices using current year PE ratios and current EPS
    const currentEPS = calculateEPS(projectionsState.baseData.net_income!, projectionsState.baseData.shares_outstanding!);
    const currentPeLow = inputs.peLow[currentYear] || 0;
    const currentPeHigh = inputs.peHigh[currentYear] || 0;
    newProjections.sharePriceLow[currentYear] = calculateStockPrice(currentEPS, currentPeLow);
    newProjections.sharePriceHigh[currentYear] = calculateStockPrice(currentEPS, currentPeHigh);

    // Start with current year values
    let previousRevenue = projectionsState.baseData.revenue!;
    let previousNetIncome = projectionsState.baseData.net_income!;

    // Calculate for each projection year
    projectionYears.forEach((year, index) => {
      const yearNum = parseInt(year);
      const yearsFromCurrent = index + 1;

      // 1. Calculate Revenue
      const revenueGrowth = inputs.revenueGrowth[year] || 0;
      const projectedRevenue = calculateProjectedRevenue(previousRevenue, revenueGrowth);
      newProjections.revenue[year] = projectedRevenue;

      // 2. Calculate Net Income from growth rate
      const netIncomeGrowth = inputs.netIncomeGrowth[year] || 0;
      const projectedNetIncome = netIncomeGrowth > 0 
        ? calculateNetIncomeFromGrowth(previousNetIncome, netIncomeGrowth)
        : 0;
      newProjections.netIncome[year] = projectedNetIncome;

      // 3. Calculate Net Income Margin
      const projectedNetIncomeMargin = calculateNetIncomeMargin(projectedNetIncome, projectedRevenue);
      newProjections.netIncomeMargin[year] = projectedNetIncomeMargin;

      // 4. Calculate EPS
      const projectedEPS = calculateEPS(projectedNetIncome, projectionsState.baseData.shares_outstanding!);
      newProjections.eps[year] = projectedEPS;

      // 5. Calculate Stock Prices
      const peLow = inputs.peLow[year] || 0;
      const peHigh = inputs.peHigh[year] || 0;
      const priceLow = calculateStockPrice(projectedEPS, peLow);
      const priceHigh = calculateStockPrice(projectedEPS, peHigh);
      newProjections.sharePriceLow[year] = priceLow;
      newProjections.sharePriceHigh[year] = priceHigh;

      // 6. Calculate CAGR (start from year 2, which is index 1, so yearsFromCurrent >= 2)
      if (yearsFromCurrent >= 2) {
        const cagrLow = calculateCAGR(priceLow, projectionsState.baseData.price!, yearsFromCurrent);
        const cagrHigh = calculateCAGR(priceHigh, projectionsState.baseData.price!, yearsFromCurrent);
        newProjections.cagrLow[year] = cagrLow;
        newProjections.cagrHigh[year] = cagrHigh;
      }

      // Update for next iteration
      previousRevenue = projectedRevenue;
      previousNetIncome = projectedNetIncome;
    });

    actions.setCalculatedProjections(newProjections);
  };

  // Recalculate when base data changes
  useEffect(() => {
    if (projectionsState?.baseData?.price && projectionsState?.baseData?.shares_outstanding && projectionsState?.baseData?.revenue && projectionsState?.baseData?.net_income && projectionsState?.projectionInputs) {
      recalculateProjections(projectionsState.projectionInputs);
    }
  }, [projectionsState?.baseData, projectionsState?.projectionInputs]);

  // Auto-load AAPL data on component mount (only run once)
  useEffect(() => {
    const loadDefaultData = async () => {
      actions.setProjectionsLoading(true);
      actions.setProjectionsError(null);
      
      try {
        // Check cache first
        const cachedData = actions.getCachedProjections('AAPL');
        if (cachedData) {
          actions.setProjectionsBaseData(cachedData);
          actions.setProjectionsLoading(false);
          return;
        }
        
        const data = await actions.fetchProjections('AAPL');
        actions.setProjectionsBaseData(data);
        
      } catch (err) {
        console.error('Error loading AAPL data:', err);
        actions.setProjectionsError(err instanceof Error ? err.message : 'Failed to load AAPL data');
      } finally {
        actions.setProjectionsLoading(false);
      }
    };
    
    loadDefaultData();
  }, []); // Empty dependency array - run only once on mount

  // Sync input field when returning to tab with different ticker
  useEffect(() => {
    if (projectionsState?.currentTicker && projectionsState.currentTicker !== stockSymbol) {
      setStockSymbol(projectionsState.currentTicker);
    }
  }, [projectionsState?.currentTicker]);

  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="w-full max-w-6xl mx-auto">
            
            {/* Stock Selection Form - Sticky */}
            <div className="sticky top-20 z-10 mb-6">
              <Card>
                <CardContent>
                  <div id="projections-stock-selection-container">
                    <form onSubmit={handleSearch} className="flex gap-2 max-w-xs mx-auto">
                      <div className="w-32">
                        <Label htmlFor="projections-stock-input" className="sr-only">
                          Stock Symbol
                        </Label>
                        <Input
                          id="projections-stock-input"
                          value={stockSymbol}
                          onChange={(e) => handleTickerChange(e.target.value)}
                        />
                      </div>
                      <Button type="submit" disabled={projectionsState?.loading || false}>
                        <Search className="h-4 w-4" />
                        {projectionsState?.loading ? 'Searching...' : 'Search'}
                      </Button>
                    </form>
                    
                    {/* Stock Info Display */}
                    <div id="projections-current-info-display" className="mt-4">
                      <div id="stock-price-info" className="text-center">
                        <span className="text-lg text-foreground font-medium">
                          {formatCurrency(projectionsState.baseData?.price || 0)}
                        </span>
                        <span className="mx-6 text-base text-muted-foreground">
                          MKT.CAP {formatCurrency(projectionsState.baseData?.market_cap || 0)}
                        </span>
                        <span className="text-base text-muted-foreground">
                          SHARES OUTSTANDING: {formatNumber(projectionsState.baseData?.shares_outstanding || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Error State */}
            {projectionsState?.error && (
              <Card>
                <CardContent>
                  <div className="text-red-600 text-center bg-red-50 p-3 rounded-md border border-red-200">{projectionsState.error}</div>
                </CardContent>
              </Card>
            )}


            {/* Combined Financial Data Table with Grouped Spacing */}
            <Card>
              <CardContent>
                <div id="projections-financial-data-table">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr id="financial-data-year-headers" className="border-b">
                          <th id="financial-metric-column" className="py-3 px-4 text-left font-medium w-1/6">Year</th>
                          <th id={`year-${currentYear}-column`} className="py-3 px-4 text-center font-medium w-1/6">{currentYear}</th>
                          <th id={`year-${projectionYears[0]}-column`} className="py-3 px-4 text-center font-medium w-1/6">{projectionYears[0]}</th>
                          <th id={`year-${projectionYears[1]}-column`} className="py-3 px-4 text-center font-medium w-1/6">{projectionYears[1]}</th>
                          <th id={`year-${projectionYears[2]}-column`} className="py-3 px-4 text-center font-medium w-1/6">{projectionYears[2]}</th>
                          <th id={`year-${projectionYears[3]}-column`} className="py-3 px-4 text-center font-medium w-1/6">{projectionYears[3]}</th>
                        </tr>
                      </thead>
                      <tbody id="financial-data-rows">
                        {/* Revenue Section */}
                        <tr id="revenue-data-row" className="border-b bg-gray-50">
                          <td className="py-3 px-4 font-medium text-left">Revenue</td>
                          <td id={`revenue-${currentYear}`} className="py-3 px-4 text-center">{formatCurrency(projectionsState.baseData?.revenue)}</td>
                          <td id={`revenue-${projectionYears[0]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState.projectionsState?.calculatedProjections?.revenue[projectionYears[0]])}</td>
                          <td id={`revenue-${projectionYears[1]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState.projectionsState?.calculatedProjections?.revenue[projectionYears[1]])}</td>
                          <td id={`revenue-${projectionYears[2]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState.projectionsState?.calculatedProjections?.revenue[projectionYears[2]])}</td>
                          <td id={`revenue-${projectionYears[3]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState.projectionsState?.calculatedProjections?.revenue[projectionYears[3]])}</td>
                        </tr>
                        <tr id="revenue-growth-input-row" className="bg-white" style={{borderBottom: '4px solid #e5e7eb'}}>
                          <td className="py-3 px-4 font-medium text-left">Rev Growth</td>
                          <td className="py-3 px-4 text-center"></td>
                          {projectionYears.map(year => (
                            <td key={year} className="py-3 px-4 text-center">
                              <Input
                                id={`revenue-growth-${year}`}
                                type="text"
                                value={formatPercentageInput(projectionsState.projectionsState?.projectionInputs?.revenueGrowth[year])}
                                onChange={(e) => {
                                  const cleanValue = e.target.value.replace('%', '');
                                  handlePercentageInputChange('revenueGrowth', year, cleanValue);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, 'revenue-growth', year)}
                                className="text-center h-8 w-16 mx-auto"
                                style={inputStyle}
                                placeholder="0%"
                              />
                            </td>
                          ))}
                        </tr>

                        {/* Net Income Section */}
                        <tr id="net-income-data-row" className="border-b bg-gray-50">
                          <td className="py-3 px-4 font-medium text-left">Net Income</td>
                          <td id={`net-income-${currentYear}`} className="py-3 px-4 text-center">{formatCurrency(projectionsState.baseData?.net_income)}</td>
                          <td id={`net-income-${projectionYears[0]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState?.calculatedProjections?.netIncome[projectionYears[0]])}</td>
                          <td id={`net-income-${projectionYears[1]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState?.calculatedProjections?.netIncome[projectionYears[1]])}</td>
                          <td id={`net-income-${projectionYears[2]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState?.calculatedProjections?.netIncome[projectionYears[2]])}</td>
                          <td id={`net-income-${projectionYears[3]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState?.calculatedProjections?.netIncome[projectionYears[3]])}</td>
                        </tr>
                        <tr id="net-income-growth-input-row" className="bg-white">
                          <td className="py-3 px-4 font-medium text-left">Net Inc Growth</td>
                          <td className="py-3 px-4 text-center"></td>
                          {projectionYears.map(year => (
                            <td key={year} className="py-3 px-4 text-center">
                              <Input
                                id={`net-income-growth-${year}`}
                                type="text"
                                value={formatPercentageInput(projectionsState?.projectionInputs?.netIncomeGrowth[year])}
                                onChange={(e) => {
                                  const cleanValue = e.target.value.replace('%', '');
                                  handlePercentageInputChange('netIncomeGrowth', year, cleanValue);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, 'net-income-growth', year)}
                                className="text-center h-8 w-16 mx-auto"
                                style={inputStyle}
                                placeholder="0%"
                              />
                            </td>
                          ))}
                        </tr>

                        {/* Net Income Margins Section - Calculated Field */}
                        <tr id="net-income-margin-row" className="bg-gray-50" style={{borderBottom: '4px solid #e5e7eb'}}>
                          <td className="py-3 px-4 font-medium text-left">Net Inc Margins</td>
                          <td className="py-3 px-4 text-center">{formatPercentage(projectionsState.baseData?.net_income_margin)}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{formatPercentage(projectionsState?.calculatedProjections?.netIncomeMargin[projectionYears[0]])}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{formatPercentage(projectionsState?.calculatedProjections?.netIncomeMargin[projectionYears[1]])}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{formatPercentage(projectionsState?.calculatedProjections?.netIncomeMargin[projectionYears[2]])}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{formatPercentage(projectionsState?.calculatedProjections?.netIncomeMargin[projectionYears[3]])}</td>
                        </tr>

                        {/* EPS Section */}
                        <tr id="eps-data-row" className="border-b bg-gray-50" style={{borderBottom: '4px solid #e5e7eb'}}>
                          <td className="py-3 px-4 font-medium text-left">EPS</td>
                          <td id={`eps-${currentYear}`} className="py-3 px-4 text-center">{formatCurrency(projectionsState.baseData?.eps)}</td>
                          <td id={`eps-${projectionYears[0]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState?.calculatedProjections?.eps[projectionYears[0]])}</td>
                          <td id={`eps-${projectionYears[1]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState?.calculatedProjections?.eps[projectionYears[1]])}</td>
                          <td id={`eps-${projectionYears[2]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState?.calculatedProjections?.eps[projectionYears[2]])}</td>
                          <td id={`eps-${projectionYears[3]}`} className="py-3 px-4 text-center text-muted-foreground">{formatCurrency(projectionsState?.calculatedProjections?.eps[projectionYears[3]])}</td>
                        </tr>
                        <tr id="pe-low-input-row" className="border-b bg-white">
                          <td className="py-3 px-4 font-medium text-left">PE Low Est</td>
                          <td className="py-3 px-4 text-center">
                            <Input
                              id={`pe-low-${currentYear}`}
                              type="text"
                              value={projectionsState?.projectionInputs?.peLow[currentYear] || ''}
                              onChange={(e) => handleProjectionInputChange('peLow', currentYear.toString(), parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const nextInput = document.getElementById(`pe-low-${projectionYears[0]}`);
                                  if (nextInput) nextInput.focus();
                                }
                              }}
                              className="text-center h-8 w-16 mx-auto"
                              style={inputStyle}
                              placeholder="0"
                            />
                          </td>
                          {projectionYears.map(year => (
                            <td key={year} className="py-3 px-4 text-center">
                              <Input
                                id={`pe-low-${year}`}
                                type="text"
                                value={projectionsState?.projectionInputs?.peLow[year] || ''}
                                onChange={(e) => handleProjectionInputChange('peLow', year, parseFloat(e.target.value) || 0)}
                                onKeyDown={(e) => handleKeyDown(e, 'pe-low', year)}
                                className="text-center h-8 w-16 mx-auto"
                                style={inputStyle}
                                placeholder="0"
                              />
                            </td>
                          ))}
                        </tr>
                        <tr id="pe-high-input-row" className="bg-white" style={{borderBottom: '4px solid #e5e7eb'}}>
                          <td className="py-3 px-4 font-medium text-left">PE High Est</td>
                          <td className="py-3 px-4 text-center">
                            <Input
                              id={`pe-high-${currentYear}`}
                              type="text"
                              value={projectionsState?.projectionInputs?.peHigh[currentYear] || ''}
                              onChange={(e) => handleProjectionInputChange('peHigh', currentYear.toString(), parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const nextInput = document.getElementById(`pe-high-${projectionYears[0]}`);
                                  if (nextInput) nextInput.focus();
                                }
                              }}
                              className="text-center h-8 w-16 mx-auto"
                              style={inputStyle}
                              placeholder="0"
                            />
                          </td>
                          {projectionYears.map(year => (
                            <td key={year} className="py-3 px-4 text-center">
                              <Input
                                id={`pe-high-${year}`}
                                type="text"
                                value={projectionsState?.projectionInputs?.peHigh[year] || ''}
                                onChange={(e) => handleProjectionInputChange('peHigh', year, parseFloat(e.target.value) || 0)}
                                onKeyDown={(e) => handleKeyDown(e, 'pe-high', year)}
                                className="text-center h-8 w-16 mx-auto"
                                style={inputStyle}
                                placeholder="0"
                              />
                            </td>
                          ))}
                        </tr>

                        {/* Share Price Section */}
                        <tr id="share-price-low-data-row" className="border-b bg-gray-50">
                          <td className="py-3 px-4 font-medium text-left">Share Price Low</td>
                          <td id={`share-price-low-${currentYear}`} className="py-3 px-4 text-center bg-orange-100">{formatCurrency(projectionsState?.calculatedProjections?.sharePriceLow[currentYear])}</td>
                          <td id={`share-price-low-${projectionYears[0]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatCurrency(projectionsState?.calculatedProjections?.sharePriceLow[projectionYears[0]])}</td>
                          <td id={`share-price-low-${projectionYears[1]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatCurrency(projectionsState?.calculatedProjections?.sharePriceLow[projectionYears[1]])}</td>
                          <td id={`share-price-low-${projectionYears[2]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatCurrency(projectionsState?.calculatedProjections?.sharePriceLow[projectionYears[2]])}</td>
                          <td id={`share-price-low-${projectionYears[3]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatCurrency(projectionsState?.calculatedProjections?.sharePriceLow[projectionYears[3]])}</td>
                        </tr>
                        <tr id="share-price-high-data-row" className="bg-gray-50" style={{borderBottom: '4px solid #e5e7eb'}}>
                          <td className="py-3 px-4 font-medium text-left">Share Price High</td>
                          <td id={`share-price-high-${currentYear}`} className="py-3 px-4 text-center bg-orange-100">{formatCurrency(projectionsState?.calculatedProjections?.sharePriceHigh[currentYear])}</td>
                          <td id={`share-price-high-${projectionYears[0]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatCurrency(projectionsState?.calculatedProjections?.sharePriceHigh[projectionYears[0]])}</td>
                          <td id={`share-price-high-${projectionYears[1]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatCurrency(projectionsState?.calculatedProjections?.sharePriceHigh[projectionYears[1]])}</td>
                          <td id={`share-price-high-${projectionYears[2]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatCurrency(projectionsState?.calculatedProjections?.sharePriceHigh[projectionYears[2]])}</td>
                          <td id={`share-price-high-${projectionYears[3]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatCurrency(projectionsState?.calculatedProjections?.sharePriceHigh[projectionYears[3]])}</td>
                        </tr>

                        {/* CAGR Section */}
                        <tr id="cagr-low-data-row" className="border-b bg-gray-50">
                          <td className="py-3 px-4 font-medium text-left">CAGR Low</td>
                          <td id={`cagr-low-${currentYear}`} className="py-3 px-4 text-center"></td>
                          <td id={`cagr-low-${projectionYears[0]}`} className="py-3 px-4 text-center"></td>
                          <td id={`cagr-low-${projectionYears[1]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatPercentage(projectionsState?.calculatedProjections?.cagrLow[projectionYears[1]])}</td>
                          <td id={`cagr-low-${projectionYears[2]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatPercentage(projectionsState?.calculatedProjections?.cagrLow[projectionYears[2]])}</td>
                          <td id={`cagr-low-${projectionYears[3]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatPercentage(projectionsState?.calculatedProjections?.cagrLow[projectionYears[3]])}</td>
                        </tr>
                        <tr id="cagr-high-data-row" className="bg-gray-50">
                          <td className="py-3 px-4 font-medium text-left">CAGR High</td>
                          <td id={`cagr-high-${currentYear}`} className="py-3 px-4 text-center"></td>
                          <td id={`cagr-high-${projectionYears[0]}`} className="py-3 px-4 text-center"></td>
                          <td id={`cagr-high-${projectionYears[1]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatPercentage(projectionsState?.calculatedProjections?.cagrHigh[projectionYears[1]])}</td>
                          <td id={`cagr-high-${projectionYears[2]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatPercentage(projectionsState?.calculatedProjections?.cagrHigh[projectionYears[2]])}</td>
                          <td id={`cagr-high-${projectionYears[3]}`} className="py-3 px-4 text-center text-muted-foreground bg-orange-100">{formatPercentage(projectionsState?.calculatedProjections?.cagrHigh[projectionYears[3]])}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </>
  );
}