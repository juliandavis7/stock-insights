import { AlertTriangle } from "lucide-react";

interface TickerNotFoundProps {
  ticker: string;
}

export function TickerNotFound({ ticker }: TickerNotFoundProps) {
  return (
    <div className="text-center">
      <div className="inline-block text-center px-4 py-2 rounded-lg border border-amber-300 bg-amber-50">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            {ticker} not found
          </h2>
        </div>
        <p className="text-sm text-gray-600 leading-tight">
          Please enter a valid ticker symbol
        </p>
      </div>
    </div>
  );
}

