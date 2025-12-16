import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AppLayout } from "~/components/app-layout";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { useSubscriptionCheck } from "~/hooks/useSubscriptionCheck";
import { usePortfolioState, useStockActions } from "~/store/stockStore";
import { Upload, FileText, X, Plus } from "lucide-react";
import {
  PieChartRecharts,
  PieChartGeography,
  PieChartIndustry,
  PieChartSector,
} from "~/components/portfolio";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { Route } from "./+types/portfolio";
import { BRAND_NAME } from "~/config/brand";
import { API_BASE_URL } from "~/config/subscription";
import { toast } from "sonner";
import { getLogoUrl } from "~/components/logos/StockLogo";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Portfolio - ${BRAND_NAME}` },
    { name: "description", content: "View and manage your stock portfolio holdings" },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const { protectedRouteLoader } = await import("~/lib/routeProtection");
  return protectedRouteLoader(args);
}

interface Holding {
  ticker: string;
  name: string | null;
  exchange: string | null;
  country_code: string | null;
  industry: string | null;
  sector: string | null;
  shares: number;
  cost_basis: number;
  market_value: number | null;
  gain_loss_pct: number | null;
  current_price: number | null;
  pe_ratio: number | null;
  percent_of_portfolio: number | null;
}

interface PortfolioResponse {
  holdings: Holding[];
  total_market_value: number;
  total_cost_basis: number;
  total_gain_loss_pct: number;
  detected_format: string;
  excluded_items: Array<{ ticker: string; reason: string }>;
}

// Formatting helper functions
const formatNumberValue = (num: number): string => {
  const rounded = parseFloat(num.toFixed(2));
  if (rounded === 0 || rounded === 100) {
    return rounded.toString();
  }
  return num.toFixed(2);
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || value === 0) return "$0";
  const absValue = Math.abs(value);
  if (absValue >= 1e12) {
    return `$${formatNumberValue(value / 1e12)}T`;
  } else if (absValue >= 1e9) {
    return `$${formatNumberValue(value / 1e9)}B`;
  } else if (absValue >= 1e6) {
    return `$${formatNumberValue(value / 1e6)}M`;
  } else if (absValue >= 1e3) {
    return `$${formatNumberValue(value / 1e3)}K`;
  }
  return `$${formatNumberValue(value)}`;
};

// Format currency with full number (no abbreviation), rounded to hundredth
const formatCurrencyFull = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format currency rounded to hundredth (2 decimal places)
const formatCurrencyRounded = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";
  return `$${value.toFixed(2)}`;
};

// Format number as integer if whole, or with decimals if not
const formatSmartNumber = (value: number): string => {
  if (value === 0) return '';
  // Check if it's a whole number
  if (Number.isInteger(value)) {
    return value.toString();
  }
  // Otherwise show with 2 decimal places
  return value.toFixed(2);
};

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  return `${formatNumberValue(value)}%`;
};

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatShares = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

// Dialog state types
type DialogState = 
  | { type: 'none' }
  | { type: 'confirm-delete'; ticker: string };

// Edited values type - store raw strings while editing to preserve user input
type EditedValues = {
  [ticker: string]: {
    shares?: string;
    cost_basis?: string;
  };
};

export default function PortfolioPage({ loaderData }: Route.ComponentProps) {
  useSubscriptionCheck();
  
  const { authenticatedFetch, getAuthToken } = useAuthenticatedFetch();
  const portfolioState = usePortfolioState();
  const actions = useStockActions();
  const [uploading, setUploading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // CRUD state
  const [searchTicker, setSearchTicker] = useState("");
  const [dialogState, setDialogState] = useState<DialogState>({ type: 'none' });
  const [editedValues, setEditedValues] = useState<EditedValues>({});
  const [showImportModal, setShowImportModal] = useState(false);

  const portfolioData = portfolioState.data;
  const loading = portfolioState.loading;
  const error = portfolioState.error;

  // Fetch portfolio data
  const fetchPortfolio = async () => {
    actions.setPortfolioLoading(true);
    actions.setPortfolioError(null);
    
    try {
      const data = await actions.fetchPortfolio(authenticatedFetch);
      if (data === null) {
        // 404 - no portfolio found (handled in fetchPortfolio)
        return;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch portfolio";
      actions.setPortfolioError(errorMessage);
      // Only show error toast for non-404 errors
      if (!errorMessage.toLowerCase().includes('404') && !errorMessage.toLowerCase().includes('not found')) {
        toast.error("Failed to load portfolio");
      }
    } finally {
      actions.setPortfolioLoading(false);
      setHasFetched(true);
    }
  };

  // Load portfolio on mount
  useEffect(() => {
    fetchPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add holding - POST /portfolio/holdings?ticker=XXX
  const addHolding = async (ticker: string) => {
    const upperTicker = ticker.trim().toUpperCase();
    if (!upperTicker) return;

    toast.loading(`Adding ${upperTicker} to portfolio`, { id: 'add-holding' });

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/portfolio/holdings?ticker=${encodeURIComponent(upperTicker)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if ticker doesn't exist (404 or similar error)
        if (response.status === 404 || 
            (errorData.detail && (
              errorData.detail.toLowerCase().includes('not found') ||
              errorData.detail.toLowerCase().includes('does not exist') ||
              errorData.detail.toLowerCase().includes('invalid ticker')
            ))) {
          toast.error('The ticker entered does not exist', { id: 'add-holding' });
          return;
        }
        
        throw new Error(errorData.detail || `Failed to add holding: ${response.status}`);
      }

      toast.success(`Successfully added ${upperTicker} to portfolio`, { id: 'add-holding' });
      setSearchTicker("");
      
      // Refresh portfolio after success
      actions.clearPortfolioCache();
      await fetchPortfolio();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add holding";
      toast.error(errorMessage, { id: 'add-holding' });
    }
  };

  // Update holding - PUT /portfolio/holdings?ticker=XXX
  // API returns updated holding + all holdings with recalculated % portfolio
  const updateHolding = async (ticker: string, shares: number, costBasis: number) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/portfolio/holdings?ticker=${encodeURIComponent(ticker)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shares, cost_basis: costBasis }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to update holding: ${response.status}`);
      }

      // API returns all holdings with recalculated values
      const data = await response.json();
      
      // Update portfolio state directly from API response
      actions.setPortfolioData({
        holdings: data.holdings,
        total_market_value: data.total_market_value,
        total_cost_basis: data.total_cost_basis,
        total_gain_loss_pct: data.total_gain_loss_pct,
        detected_format: portfolioData?.detected_format || 'unknown',
        excluded_items: portfolioData?.excluded_items || [],
      });
      
      // Clear cache so next full fetch gets fresh data
      actions.clearPortfolioCache();
      
      // Clear edited values for this ticker
      setEditedValues(prev => {
        const newValues = { ...prev };
        delete newValues[ticker];
        return newValues;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update holding";
      toast.error(errorMessage);
    }
  };

  // Delete holding - DELETE /portfolio/holdings?ticker=XXX
  const deleteHolding = async (ticker: string) => {
    setDialogState({ type: 'none' });
    toast.loading(`Removing ${ticker} from portfolio`, { id: 'delete-holding' });

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/portfolio/holdings?ticker=${encodeURIComponent(ticker)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete holding: ${response.status}`);
      }

      toast.success(`Successfully removed ${ticker} from portfolio`, { id: 'delete-holding' });
      
      // Refresh portfolio after success
      actions.clearPortfolioCache();
      await fetchPortfolio();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete holding";
      toast.error(errorMessage, { id: 'delete-holding' });
    }
  };

  // Handle add stock submission
  const handleAddStock = () => {
    if (searchTicker.trim()) {
      addHolding(searchTicker);
    }
  };

  // Handle key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddStock();
    }
  };

  // Handle edit field change - store raw string to preserve user input
  const handleEditChange = (ticker: string, field: 'shares' | 'cost_basis', value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [ticker]: {
        ...prev[ticker],
        [field]: value,
      },
    }));
  };

  // Handle save on blur
  const handleSaveOnBlur = (holding: Holding) => {
    const edited = editedValues[holding.ticker];
    if (!edited) return;

    // Calculate current avg cost basis
    const currentAvgCostBasis = holding.shares > 0 ? holding.cost_basis / holding.shares : 0;
    
    // Parse string values to numbers (handle empty string and NaN)
    let newShares = holding.shares;
    if (edited.shares !== undefined && edited.shares !== '') {
      const parsed = parseFloat(edited.shares);
      if (!isNaN(parsed)) newShares = parsed;
    }
    
    // Cost basis in editedValues is per-share, need to convert to total
    let newAvgCostBasis = currentAvgCostBasis;
    if (edited.cost_basis !== undefined && edited.cost_basis !== '') {
      const parsed = parseFloat(edited.cost_basis);
      if (!isNaN(parsed)) newAvgCostBasis = parsed;
    }
    
    const newTotalCostBasis = newAvgCostBasis * newShares;

    // Check if values actually changed (with small tolerance for floating point)
    const sharesChanged = Math.abs(newShares - holding.shares) > 0.0001;
    const costBasisChanged = Math.abs(newTotalCostBasis - holding.cost_basis) > 0.01;

    if (sharesChanged || costBasisChanged) {
      updateHolding(holding.ticker, newShares, newTotalCostBasis);
    } else {
      // Clear edited values if nothing changed
      setEditedValues(prev => {
        const newValues = { ...prev };
        delete newValues[holding.ticker];
        return newValues;
      });
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    setUploading(true);
    actions.setPortfolioError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // For FormData, we need to use fetch directly to avoid Content-Type header override
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Failed to obtain authentication token");
      }

      const response = await fetch(`${API_BASE_URL}/portfolio/upload?format=auto`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for multipart/form-data
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Failed to upload portfolio: ${response.status}`;
        throw new Error(errorMessage);
      }

      const uploadData = await response.json();
      toast.success("Portfolio uploaded successfully");
      
      // Close import modal
      setShowImportModal(false);
      
      // Clear cache and fetch fresh portfolio data
      actions.clearPortfolioCache();
      await fetchPortfolio();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload portfolio";
      actions.setPortfolioError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Prepare pie chart data
  const pieChartData = portfolioData?.holdings
    .filter(h => h.percent_of_portfolio !== null && h.percent_of_portfolio > 0) || [];

  return (
    <AppLayout user={loaderData.user}>
      <main className="min-h-screen bg-page-background">
        <div className="container mx-auto px-6 py-8">
          <div className="w-full max-w-7xl mx-auto">
            
            {/* Search Section - matching stock-search-header.tsx height */}
            <div className="pt-4 mb-5">
              {/* Primary: Add ticker */}
              <div className="flex justify-center mb-2">
                <div className="flex gap-2">
                  <div className="w-56">
                    <Input
                      placeholder="Add companies or ETFs"
                      value={searchTicker}
                      onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                      onKeyDown={handleSearchKeyPress}
                      className="text-center"
                    />
                  </div>
                  <Button 
                    onClick={handleAddStock} 
                    disabled={!searchTicker.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-100"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* "or" on its own line */}
              <div className="text-center">
                <span className="text-sm text-gray-400">or</span>
              </div>
              
              {/* Import button - opens modal */}
              <div className="flex flex-col items-center mt-2">
                <Button onClick={() => setShowImportModal(true)} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import from Brokerage
                </Button>
              </div>
            </div>

            {/* File Input (hidden, always present) */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="portfolio-file-input"
              disabled={uploading}
            />


            {/* Holdings Table Card - Always show table with headers */}
            <Card className="relative mb-6">
              <LoadingOverlay isLoading={loading} />
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-bold text-gray-900 text-sm whitespace-nowrap min-w-[280px]">
                          Ticker
                        </th>
                        <th className="py-3 px-4 text-right font-bold text-gray-900 text-sm whitespace-nowrap w-[110px]">
                          % Portfolio
                        </th>
                        <th className="py-3 px-4 text-right font-bold text-gray-900 text-sm whitespace-nowrap w-[130px]">
                          Shares
                        </th>
                        <th className="py-3 px-4 text-right font-bold text-gray-900 text-sm whitespace-nowrap w-[150px]">
                          Avg. Cost Basis
                        </th>
                        <th className="py-3 px-4 text-right font-bold text-gray-900 text-sm whitespace-nowrap w-[140px]">
                          Market Value
                        </th>
                        <th className="py-3 px-4 text-right font-bold text-gray-900 text-sm whitespace-nowrap w-[110px]">
                          % Change
                        </th>
                        <th className="py-3 px-4 text-right font-bold text-gray-900 text-sm whitespace-nowrap w-[110px]">
                          Stock Price
                        </th>
                        <th className="py-3 px-4 text-right font-bold text-gray-900 text-sm whitespace-nowrap w-[90px]">
                          P/E
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Loading State */}
                      {(loading || !hasFetched) && !portfolioData && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <LoadingOverlay isLoading={true} />
                              <p className="text-gray-600 mt-4">Loading data...</p>
                            </div>
                          </td>
                        </tr>
                      )}
                      
                      {/* Empty State - No holdings */}
                      {hasFetched && !loading && portfolioData && portfolioData.holdings.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <FileText className="w-12 h-12 text-gray-300 mb-3" />
                              <p className="text-gray-500 text-sm">
                                Add a stock above or import from your brokerage to get started
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                      
                      {/* Holdings Data */}
                      {portfolioData && portfolioData.holdings.length > 0 && portfolioData.holdings.map((holding) => {
                            // Calculate average cost basis per share
                            const avgCostBasis = holding.shares > 0 ? holding.cost_basis / holding.shares : 0;
                            const edited = editedValues[holding.ticker];
                            
                            return (
                              <tr key={holding.ticker} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-2 px-4 text-sm">
                                  <div className="flex items-center justify-between w-full">
                                    {/* Left side: Logo + Company info */}
                                    <div className="flex items-center gap-3">
                                      {/* Company logo */}
                                      <img 
                                        src={getLogoUrl(holding.ticker)}
                                        alt={holding.name || holding.ticker}
                                        className="w-10 h-10 rounded-lg object-contain bg-gray-300 p-1"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                      
                                      {/* Company info - two lines */}
                                      <div className="flex flex-col">
                                        {/* Line 1: Company name as link */}
                                        {holding.name ? (
                                          <Link 
                                            to={`/stock/${holding.ticker}`} 
                                            className="text-sm font-medium text-gray-900 hover:underline truncate max-w-[200px]"
                                            title={holding.name}
                                          >
                                            {holding.name}
                                          </Link>
                                        ) : (
                                          <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                            {holding.ticker}
                                          </span>
                                        )}
                                        
                                        {/* Line 2: Flag + Exchange:Ticker */}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                          {holding.country_code && (
                                            <img 
                                              src={`https://flagcdn.com/${holding.country_code.toLowerCase()}.svg`}
                                              alt={holding.country_code.toUpperCase()}
                                              className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0 scale-115"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                              }}
                                            />
                                          )}
                                          <span>
                                            {holding.exchange ? `${holding.exchange}:${holding.ticker}` : holding.ticker}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Right side: Delete button */}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={() => setDialogState({ type: 'confirm-delete', ticker: holding.ticker })}
                                            className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Remove from portfolio</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </td>
                                <td className="py-2 px-4 text-right font-medium text-gray-900 text-sm">
                                  {formatPercentage(holding.percent_of_portfolio)}
                                </td>
                                <td className="py-2 px-2">
                                  <Input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={edited?.shares !== undefined 
                                      ? edited.shares
                                      : formatSmartNumber(holding.shares)}
                                    onChange={(e) => handleEditChange(holding.ticker, 'shares', e.target.value)}
                                    onBlur={() => handleSaveOnBlur(holding)}
                                    className="w-full text-right text-sm h-8"
                                    placeholder=""
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                    <Input
                                      type="number"
                                      step="any"
                                      min="0"
                                      value={edited?.cost_basis !== undefined 
                                        ? edited.cost_basis
                                        : (avgCostBasis === 0 ? '' : avgCostBasis.toFixed(2))}
                                      onChange={(e) => handleEditChange(holding.ticker, 'cost_basis', e.target.value)}
                                      onBlur={() => handleSaveOnBlur(holding)}
                                      className="w-full text-right text-sm h-8 pl-5"
                                      placeholder=""
                                    />
                                  </div>
                                </td>
                                <td className="py-2 px-4 text-right font-medium text-gray-900 text-sm">
                                  {holding.shares === 0 ? '-' : (holding.market_value !== null ? formatCurrencyFull(holding.market_value) : '-')}
                                </td>
                                <td className={`py-2 px-4 text-right font-medium text-sm ${
                                  holding.shares === 0 || holding.gain_loss_pct === null
                                    ? 'text-gray-900'
                                    : holding.gain_loss_pct >= 0 ? 'text-bull' : 'text-bear'
                                }`}>
                                  {holding.shares === 0 || holding.cost_basis === 0 ? '-' : formatPercentage(holding.gain_loss_pct)}
                                </td>
                                <td className="py-2 px-4 text-right font-medium text-gray-900 text-sm">
                                  {holding.current_price !== null ? formatCurrency(holding.current_price) : "N/A"}
                                </td>
                                <td className="py-2 px-4 text-right font-medium text-gray-900 text-sm">
                                  {holding.pe_ratio !== null ? formatNumber(holding.pe_ratio) : "N/A"}
                                </td>
                              </tr>
                            );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart Cards - Only show when there are holdings */}
            {pieChartData.length > 0 && portfolioData && portfolioData.holdings.length > 0 && (
              <>
                {/* First Row: Portfolio Holdings and Geography Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-0 overflow-visible mt-12">
                  <PieChartRecharts data={portfolioData} />
                  <PieChartGeography data={portfolioData} />
                </div>

                {/* Second Row: Industry Breakdown and Sector Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 overflow-visible">
                  <PieChartIndustry data={portfolioData} />
                  <PieChartSector data={portfolioData} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Confirm Delete Dialog */}
        <Dialog open={dialogState.type === 'confirm-delete'} onOpenChange={() => setDialogState({ type: 'none' })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Remove {dialogState.type === 'confirm-delete' ? dialogState.ticker : ''} from Portfolio
              </DialogTitle>
              <DialogDescription className="mt-2">
                Are you sure you want to remove this company from your portfolio?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 mt-4">
              <Button 
                variant="outline"
                onClick={() => setDialogState({ type: 'none' })}
                className="hover:bg-gray-100 hover:text-gray-900"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => dialogState.type === 'confirm-delete' && deleteHolding(dialogState.ticker)}
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import CSV Modal */}
        <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Import from Brokerage
              </DialogTitle>
              <DialogDescription className="mt-2">
                Export your positions as CSV from your brokerage and upload here.
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              {/* Supported Brokerages */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Supported brokerages:</p>
                <div className="flex flex-wrap gap-2">
                  {['Chase', 'Fidelity', 'Schwab'].map((brokerage) => (
                    <span 
                      key={brokerage} 
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {brokerage}
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">How to export:</p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Log into your brokerage account</li>
                  <li>Navigate to Positions or Holdings</li>
                  <li>Look for "Export" or "Download as CSV"</li>
                  <li>Upload the file below</li>
                </ol>
              </div>

              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload CSV file'}
                </p>
                <p className="text-xs text-gray-400 mt-1">or drag and drop</p>
              </div>

              {/* Fallback Message */}
              <p className="text-xs text-gray-400 text-center">
                Don't see your brokerage? Add positions manually using the search above.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </AppLayout>
  );
}

