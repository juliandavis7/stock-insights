# Ticker State Management Implementation Guide for Claude Code

## Overview

Implement global ticker state management so that when a user searches for a ticker on any tab, that ticker persists and displays across all tabs (Search, Projections, Earnings Calls, SEC Filings, etc.). This creates a cohesive research experience where users are always viewing data for the same company across all sections.

## Implementation Strategy

### 1. Global State Management

**Create a global ticker context or state management solution:**

```javascript
// Create: src/context/TickerContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface TickerContextType {
  currentTicker: string | null;
  setCurrentTicker: (ticker: string) => void;
  clearTicker: () => void;
}

const TickerContext = createContext<TickerContextType | undefined>(undefined);

export const TickerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTicker, setCurrentTicker] = useState<string | null>(null);

  const clearTicker = () => setCurrentTicker(null);

  return (
    <TickerContext.Provider value={{ currentTicker, setCurrentTicker, clearTicker }}>
      {children}
    </TickerContext.Provider>
  );
};

export const useTicker = () => {
  const context = useContext(TickerContext);
  if (context === undefined) {
    throw new Error('useTicker must be used within a TickerProvider');
  }
  return context;
};
```

### 2. App-Level Provider Setup

**Wrap your main App component with the TickerProvider:**

```javascript
// In src/App.tsx or src/main.tsx
import { TickerProvider } from './context/TickerContext';

function App() {
  return (
    <TickerProvider>
      {/* Your existing app structure */}
      <Router>
        <Routes>
          {/* All your routes */}
        </Routes>
      </Router>
    </TickerProvider>
  );
}
```

### 3. Search Component Updates

**Modify all ticker search components to use global state:**

```javascript
// In any search component (Search page, header search, etc.)
import { useTicker } from '../context/TickerContext';

const SearchComponent = () => {
  const { currentTicker, setCurrentTicker } = useTicker();
  const [inputValue, setInputValue] = useState(currentTicker || '');

  const handleSearch = (ticker: string) => {
    setCurrentTicker(ticker.toUpperCase());
    setInputValue(ticker.toUpperCase());
    // Trigger any additional search logic
  };

  // Sync input with global state when ticker changes from other components
  useEffect(() => {
    if (currentTicker && currentTicker !== inputValue) {
      setInputValue(currentTicker);
    }
  }, [currentTicker]);

  return (
    <input 
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onSubmit={() => handleSearch(inputValue)}
      placeholder="Enter ticker (e.g., AAPL)"
    />
  );
};
```

### 4. Page Components Updates

**Update all page components to consume the global ticker:**

```javascript
// Example: ChartsPage.tsx, ProjectionsPage.tsx, etc.
import { useTicker } from '../context/TickerContext';

const ChartsPage = () => {
  const { currentTicker } = useTicker();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch data when ticker changes
  useEffect(() => {
    if (currentTicker) {
      fetchChartData(currentTicker);
    }
  }, [currentTicker]);

  const fetchChartData = async (ticker: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${host}/charts?ticker=${ticker}`);
      const data = await response.json();
      setChartData(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentTicker) {
    return <div>Please search for a ticker to view charts</div>;
  }

  return (
    <div>
      <h1>Charts for {currentTicker}</h1>
      {loading ? <LoadingSpinner /> : <Charts data={chartData} />}
    </div>
  );
};
```

### 5. Navigation/Header Updates

**Update the header/navigation to show current ticker:**

```javascript
// In your Header/Navigation component
import { useTicker } from '../context/TickerContext';

const Header = () => {
  const { currentTicker } = useTicker();

  return (
    <header>
      <nav>
        <Link to="/search">Search</Link>
        <Link to="/projections">Projections</Link>
        <Link to="/earnings-calls">Earnings Calls</Link>
        <Link to="/sec-filings">SEC Filings</Link>
      </nav>
      
      {/* Show current ticker if one is selected */}
      {currentTicker && (
        <div className="current-ticker-display">
          Currently viewing: {currentTicker}
        </div>
      )}
      
      {/* Global search input */}
      <SearchComponent />
    </header>
  );
};
```

## Key Implementation Requirements

### 1. URL State Synchronization (Optional but Recommended)

Consider syncing the ticker with URL parameters:

```javascript
// Add to your ticker context or individual pages
const syncTickerWithURL = (ticker: string) => {
  const url = new URL(window.location);
  url.searchParams.set('ticker', ticker);
  window.history.pushState({}, '', url);
};

const getTickerFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('ticker');
};
```

### 2. Persistence (Optional)

Store the last searched ticker in localStorage:

```javascript
// In TickerContext
const [currentTicker, setCurrentTicker] = useState<string | null>(
  () => localStorage.getItem('lastTicker')
);

const setCurrentTickerWithPersistence = (ticker: string) => {
  setCurrentTicker(ticker);
  localStorage.setItem('lastTicker', ticker);
};
```

### 3. Loading States

Implement consistent loading states across all pages:

```javascript
// Add to TickerContext
const [isLoading, setIsLoading] = useState(false);

// Use in components
const { currentTicker, isLoading } = useTicker();
```

## Component Update Checklist

Update these components to use the global ticker state:

- ✅ **Search Page** - Use and set global ticker
- ✅ **Charts Page** - Read global ticker, fetch data accordingly  
- ✅ **Projections Page** - Read global ticker, fetch projections data
- ✅ **Earnings Calls Page** - Read global ticker, fetch earnings data
- ✅ **SEC Filings Page** - Read global ticker, fetch filings data
- ✅ **Header/Navigation** - Display current ticker, provide global search
- ✅ **Any search components** - Set global ticker on search

## Error Handling

```javascript
// In pages that depend on ticker data
if (!currentTicker) {
  return (
    <div className="no-ticker-message">
      <p>Please search for a stock ticker to view this data</p>
      <SearchComponent />
    </div>
  );
}
```

## Testing Scenarios

1. **Search on one tab** → switch to another tab → verify same ticker displays
2. **Direct URL access** → ensure ticker loads from URL parameter if present
3. **Page refresh** → verify ticker persists (if using localStorage)
4. **Invalid ticker** → ensure error handling works across all tabs
5. **Empty state** → verify all pages handle no-ticker state gracefully

## Success Criteria

- Users can search for a ticker on any page and it appears across all tabs
- Switching between tabs maintains the same ticker context
- All pages that display ticker-specific data automatically update when ticker changes
- URL optionally reflects current ticker for shareable links
- Clean error states when no ticker is selected
- Consistent loading states across all ticker-dependent pages

This implementation creates a seamless, professional research experience where users can flow naturally between different data views for the same company.