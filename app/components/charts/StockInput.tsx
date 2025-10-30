import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { AlertCircle } from "lucide-react";

interface StockInputProps {
  onSearch: (ticker: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function StockInput({ onSearch, loading, error }: StockInputProps) {
  const [ticker, setTicker] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      await onSearch(ticker.toUpperCase());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div id="charts-stock-selection-container" className="mb-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Enter Stock Ticker</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="charts-stock-input">Stock Ticker</Label>
              <Input
                id="charts-stock-input"
                type="text"
                placeholder="Enter ticker (e.g., AAPL)"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="uppercase"
                disabled={loading}
              />
            </div>
            <Button 
              id="charts-show-button"
              type="submit"
              disabled={loading || !ticker.trim()}
              className="w-full"
            >
              {loading ? "Loading..." : "Show Charts"}
            </Button>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}