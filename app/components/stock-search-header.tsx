import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Search } from "lucide-react";

interface StockSearchHeaderProps {
  stockSymbol: string;
  onStockSymbolChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
  ticker?: string;
  stockPrice?: number | null;
  marketCap?: number | null;
  sharesOutstanding?: number | null;
  showSharesOutstanding?: boolean;
  formatCurrency: (value: number | null | undefined) => string;
  formatNumber: (value: number | null | undefined) => string;
}

export function StockSearchHeader({
  stockSymbol,
  onStockSymbolChange,
  onSearch,
  loading = false,
  ticker,
  stockPrice,
  marketCap,
  sharesOutstanding,
  showSharesOutstanding = false,
  formatCurrency,
  formatNumber
}: StockSearchHeaderProps) {
  const hasStockData = ticker || stockPrice || marketCap;

  return (
    <div className="mb-4">
      {/* Search Section */}
      <div className="flex justify-center mb-4">
        <div className="flex gap-2">
          <div className="w-32">
            <Label htmlFor="stock-symbol" className="sr-only">
              Stock Symbol
            </Label>
            <Input
              id="stock-symbol"
              placeholder="Enter ticker (e.g., PYPL)"
              value={stockSymbol}
              onChange={(e) => onStockSymbolChange(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} onClick={onSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stock Info Header */}
      {hasStockData && (
        <div className="mb-3">  
          <div className="flex justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {ticker || stockSymbol}
              </h1>
              <div className="space-x-6 text-sm text-gray-600">
                <span>
                  STOCK PRICE: {formatCurrency(stockPrice)}
                </span>
                <span>
                  MKT.CAP: {formatCurrency(marketCap)}
                </span>
                {showSharesOutstanding && (
                  <span>
                    SHARES OUTSTANDING: {formatNumber(sharesOutstanding)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}