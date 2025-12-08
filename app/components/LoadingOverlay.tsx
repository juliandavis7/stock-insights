interface LoadingOverlayProps {
  isLoading: boolean;
  isPolling?: boolean;
  dataType?: 'metrics' | 'projections' | 'financials'; // Kept for backward compatibility but not used
}

export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  if (!isLoading) {
    return null;
  }

  const primaryMessage = 'Loading data...';
  const secondaryMessage = 'This may take a moment';

  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        
        {/* Messages */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-gray-700 font-medium">{primaryMessage}</p>
          <p className="text-sm text-gray-500">{secondaryMessage}</p>
        </div>
      </div>
    </div>
  );
}

