import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Search } from "lucide-react";
import { TickerNotFound } from "~/components/ticker-not-found";
import { useGlobalTicker } from "~/store/stockStore";
import { getLogoUrl, LOGO_CONFIG } from "~/components/logos/StockLogo";

interface StockSearchHeaderProps {
  stockSymbol: string;
  onStockSymbolChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
  ticker?: string;
  companyName?: string | null;
  exchange?: string | null;
  countryCode?: string | null;
  stockPrice?: number | null;
  marketCap?: number | null;
  sharesOutstanding?: number | null;
  showSharesOutstanding?: boolean;
  formatCurrency: (value: number | null | undefined) => string;
  formatNumber: (value: number | null | undefined) => string;
  error?: string | null;
}

export function StockSearchHeader({
  stockSymbol,
  onStockSymbolChange,
  onSearch,
  loading = false,
  ticker,
  companyName,
  exchange,
  countryCode,
  stockPrice,
  marketCap,
  sharesOutstanding,
  showSharesOutstanding = false,
  formatCurrency,
  formatNumber,
  error
}: StockSearchHeaderProps) {
  const globalTicker = useGlobalTicker();
  const hasStockData = ticker || stockPrice || marketCap;
  
  // Format shares outstanding in abbreviated form (similar to formatCurrency but without $)
  const formatSharesAbbreviated = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value) || value === 0) return "0";
    const absValue = Math.abs(value);
    if (absValue >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    } else if (absValue >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    } else if (absValue >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    }
    return value.toLocaleString();
  };
  
  // Check if error is a "not found" type error
  const isNotFoundError = error && (
    error.toLowerCase().includes('not found') || 
    error.toLowerCase().includes('404') ||
    error.toLowerCase().includes('does not exist')
  );

  return (
    <div className="pt-4 mb-4">
      {/* Search Section */}
      <div className="flex justify-center mb-4">
        <div className="flex gap-2">
          <div className="w-24">
            <Label htmlFor="stock-symbol" className="sr-only">
              Stock Symbol
            </Label>
            <Input
              id="stock-symbol"
              placeholder="Enter ticker symbol"
              className="text-center"
              value={stockSymbol}
              onChange={(e) => onStockSymbolChange(e.target.value.toUpperCase())}
            />
          </div>
          <Button type="submit" onClick={onSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stock Info Header or Not Found State */}
      <div className="mb-3 h-16 flex items-center justify-center">
        {loading ? (
          /* Skeleton Loader */
          <div className="inline-flex items-center gap-6 animate-pulse">
            {/* Logo skeleton */}
            <div className="flex items-center gap-3">
              <div className="w-[52px] h-[52px] bg-gray-200 rounded-xl" />
              <div className="flex flex-col gap-2">
                <div className="w-32 h-5 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
              </div>
            </div>
            {/* Divider */}
            <div className="w-px h-10 bg-gray-200" />
            {/* Metrics skeleton */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end gap-1">
                <div className="w-16 h-4 bg-gray-200 rounded" />
                <div className="w-10 h-3 bg-gray-200 rounded" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="w-20 h-4 bg-gray-200 rounded" />
                <div className="w-14 h-3 bg-gray-200 rounded" />
              </div>
              {showSharesOutstanding && (
                <div className="flex flex-col items-end gap-1">
                  <div className="w-16 h-4 bg-gray-200 rounded" />
                  <div className="w-12 h-3 bg-gray-200 rounded" />
                </div>
              )}
            </div>
          </div>
        ) : isNotFoundError ? (
          <TickerNotFound 
            ticker={globalTicker.currentTicker?.toUpperCase() || stockSymbol.toUpperCase()}
          />
        ) : hasStockData && (
          <div className="inline-flex items-center gap-6">
            {/* Left: Logo + Company Info */}
            <div className="flex items-center gap-3">
              {/* Company Logo */}
              {ticker && (
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '0.75rem',
                    backgroundColor: LOGO_CONFIG.backgroundColor,
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={getLogoUrl(ticker)}
                    alt={companyName || ticker}
                    style={{
                      width: 38,
                      height: 38,
                      objectFit: LOGO_CONFIG.objectFit,
                      filter: LOGO_CONFIG.imageFilter,
                    }}
                    referrerPolicy={LOGO_CONFIG.referrerPolicy}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Company Info - Two Lines */}
              <div className="flex flex-col items-start">
                {/* Line 1: Company Name */}
                <h1 className="text-lg font-bold text-gray-900">
                  {companyName || ticker || stockSymbol}
                </h1>
                
                {/* Line 2: Flag + Exchange:Ticker */}
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  {countryCode && (
                    <img
                      src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`}
                      alt={countryCode.toUpperCase()}
                      className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span>
                    {exchange ? `${exchange}:${ticker || stockSymbol}` : (ticker || stockSymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-gray-200" />

            {/* Right: Metrics */}
            <div className="flex items-center gap-6">
              {/* Stock Price */}
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(stockPrice)}
                </span>
                <span className="text-sm text-gray-600">
                  Price
                </span>
              </div>

              {/* Market Cap */}
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(marketCap)}
                </span>
                <span className="text-sm text-gray-600">
                  Mkt Cap
                </span>
              </div>

              {/* Shares Outstanding (optional) */}
              {showSharesOutstanding && (
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatSharesAbbreviated(sharesOutstanding)}
                  </span>
                  <span className="text-sm text-gray-600">
                    Shares
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
